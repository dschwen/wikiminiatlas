export function parentTile(tile) {
  if (tile.z <= 0) {
    return null;
  }
  return {
    x: Math.floor(tile.x / 2),
    y: Math.floor(tile.y / 2),
    z: tile.z - 1
  };
}
export function ancestorsFromRoot(tile) {
  const ancestors = [];
  let current = { x: tile.x, y: tile.y, z: tile.z };
  while (current) {
    ancestors.push(current);
    current = parentTile(current);
  }
  return ancestors.reverse();
}

export function textureTransformForAncestor(tile, ancestor) {
  if (ancestor.z > tile.z) {
    throw new RangeError('ancestor zoom cannot exceed tile zoom');
  }
  const levels = tile.z - ancestor.z;
  const divisor = 2 ** levels;
  if (
    Math.floor(tile.x / divisor) !== ancestor.x ||
    Math.floor(tile.y / divisor) !== ancestor.y
  ) {
    throw new RangeError('the supplied tile is not a descendant of the ancestor');
  }

  const scale = 1 / divisor;
  return {
    offsetX: (tile.x - ancestor.x * divisor) * scale,
    offsetY: (tile.y - ancestor.y * divisor) * scale,
    scaleX: scale,
    scaleY: scale
  };
}

export class TileResourceManager {
  constructor({
    gl,
    tileKey,
    tileUrl,
    tileProducer = null,
    tileSize = 128,
    createImage = () => new Image(),
    now = () => performance.now(),
    onChange = () => {},
    maximumConcurrentRequests = 12,
    maximumResidentTextures = 384,
    maximumTextureBytes = 32 * 1024 * 1024,
    maximumEntries = 1536,
    cancellationGraceFrames = 2,
    retryDelayMilliseconds = 30000
  }) {
    this.gl = gl;
    this.tileKey = tileKey;
    this.tileUrl = tileUrl;
    this.tileProducer = tileProducer;
    this.tileSize = tileSize;
    this.createImage = createImage;
    this.now = now;
    this.onChange = onChange;
    this.maximumConcurrentRequests = maximumConcurrentRequests;
    this.maximumResidentTextures = maximumResidentTextures;
    this.maximumTextureBytes = maximumTextureBytes;
    this.maximumEntries = maximumEntries;
    this.cancellationGraceFrames = cancellationGraceFrames;
    this.retryDelayMilliseconds = retryDelayMilliseconds;
    this.entries = new Map();
    this.queue = new Set();
    this.frame = 0;
    this.inFlight = 0;
    this.destroyed = false;
  }

  beginFrame() {
    this.frame += 1;
  }

  entryFor(tile) {
    const key = this.tileKey(tile.x, tile.y, tile.z);
    let entry = this.entries.get(key);
    if (!entry) {
      entry = {
        key,
        tile: { x: tile.x, y: tile.y, z: tile.z },
        url: this.tileUrl(tile),
        status: 'idle',
        texture: null,
        image: null,
        controller: null,
        bytes: 0,
        priority: -Infinity,
        lastDemandFrame: -Infinity,
        lastUsedFrame: -Infinity,
        pinnedFrame: -Infinity,
        retryAt: 0,
        token: 0,
        error: null
      };
      this.entries.set(key, entry);
    }
    return entry;
  }

  demand(tile, { priority = 0, pin = false } = {}) {
    const entry = this.entryFor(tile);
    entry.lastDemandFrame = this.frame;
    entry.lastUsedFrame = this.frame;
    entry.priority = Math.max(entry.priority, priority);
    if (pin) {
      entry.pinnedFrame = this.frame;
    }

    if (entry.status === 'ready' || entry.status === 'loading') {
      return entry;
    }
    if (entry.status === 'error' && this.now() < entry.retryAt) {
      return entry;
    }

    entry.status = 'queued';
    entry.error = null;
    this.queue.add(entry.key);
    return entry;
  }

  resolve(tile, { pin = true } = {}) {
    let current = { x: tile.x, y: tile.y, z: tile.z };
    while (current) {
      const entry = this.entries.get(this.tileKey(current.x, current.y, current.z));
      if (entry && entry.status === 'ready') {
        entry.lastUsedFrame = this.frame;
        if (pin) {
          entry.pinnedFrame = this.frame;
        }
        return {
          entry,
          transform: textureTransformForAncestor(tile, current),
          fallbackLevels: tile.z - current.z
        };
      }
      current = parentTile(current);
    }
    return null;
  }

  endFrame() {
    for (const key of [...this.queue]) {
      const entry = this.entries.get(key);
      if (!entry || entry.lastDemandFrame !== this.frame) {
        this.queue.delete(key);
        if (entry && entry.status === 'queued') {
          entry.status = 'idle';
          entry.priority = -Infinity;
        }
      }
    }

    for (const entry of this.entries.values()) {
      if (
        entry.status === 'loading' &&
        this.frame - entry.lastDemandFrame > this.cancellationGraceFrames
      ) {
        this.cancelLoading(entry);
      }
    }

    this.enforceBudget();
    this.pruneMetadata();
    this.pump();
  }

  nextQueuedEntry() {
    let best = null;
    for (const key of this.queue) {
      const entry = this.entries.get(key);
      if (!entry || entry.status !== 'queued') {
        this.queue.delete(key);
        continue;
      }
      if (!best || entry.priority > best.priority) {
        best = entry;
      }
    }
    return best;
  }

  pump() {
    while (!this.destroyed && this.inFlight < this.maximumConcurrentRequests) {
      const entry = this.nextQueuedEntry();
      if (!entry) {
        break;
      }
      this.queue.delete(entry.key);
      this.startLoading(entry);
    }
  }

  startLoading(entry) {
    if (this.tileProducer) {
      this.startProducing(entry);
      return;
    }
    const image = this.createImage();
    const token = entry.token + 1;
    entry.token = token;
    entry.image = image;
    entry.status = 'loading';
    this.inFlight += 1;

    if ('decoding' in image) {
      image.decoding = 'async';
    }
    if ('crossOrigin' in image) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => this.finishLoading(entry, image, token);
    image.onerror = () => this.failLoading(entry, image, token);
    image.src = entry.url;
  }

  startProducing(entry) {
    const token = entry.token + 1;
    const controller = new AbortController();
    entry.token = token;
    entry.controller = controller;
    entry.status = 'loading';
    this.inFlight += 1;

    Promise.resolve()
      .then(() => this.tileProducer(entry.tile, entry.url, controller.signal))
      .then((source) => this.finishProduced(entry, source, token, controller))
      .catch((error) => this.failProduced(entry, error, token, controller));
  }

  finishProduced(entry, source, token, controller) {
    if (
      this.destroyed || entry.token !== token ||
      entry.controller !== controller || controller.signal.aborted
    ) {
      if (source && typeof source.close === 'function') {
        source.close();
      }
      return;
    }
    this.uploadSource(entry, source);
    entry.controller = null;
    this.inFlight -= 1;
    if (source && typeof source.close === 'function') {
      source.close();
    }
    this.enforceBudget();
    this.onChange();
    this.pump();
  }

  failProduced(entry, error, token, controller) {
    if (this.destroyed || entry.token !== token || entry.controller !== controller) {
      return;
    }
    const aborted = controller.signal.aborted || (error && error.name === 'AbortError');
    entry.controller = null;
    entry.status = aborted ? 'idle' : 'error';
    entry.error = aborted ? null : error;
    entry.retryAt = aborted ? 0 : this.now() + this.retryDelayMilliseconds;
    entry.priority = -Infinity;
    this.inFlight -= 1;
    this.onChange();
    this.pump();
  }

  finishLoading(entry, image, token) {
    if (this.destroyed || entry.token !== token || entry.image !== image) {
      return;
    }

    this.uploadSource(entry, image);

    this.releaseImage(entry, image);
    this.inFlight -= 1;
    this.enforceBudget();
    this.onChange();
    this.pump();
  }

  uploadSource(entry, source) {
    if (!source) {
      throw new TypeError('tile producer returned no texture source');
    }
    const gl = this.gl;
    let texture = null;
    try {
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      entry.texture = texture;
      entry.bytes = (source.naturalWidth || source.width || this.tileSize) *
        (source.naturalHeight || source.height || this.tileSize) * 4;
      entry.status = 'ready';
      entry.error = null;
      entry.lastUsedFrame = this.frame;
    } catch (error) {
      if (texture) {
        gl.deleteTexture(texture);
      }
      entry.status = 'error';
      entry.error = error;
      entry.retryAt = this.now() + this.retryDelayMilliseconds;
    }
  }

  failLoading(entry, image, token) {
    if (this.destroyed || entry.token !== token || entry.image !== image) {
      return;
    }
    entry.status = 'error';
    entry.error = new Error(`Failed to load tile ${entry.key}`);
    entry.retryAt = this.now() + this.retryDelayMilliseconds;
    this.releaseImage(entry, image);
    this.inFlight -= 1;
    this.onChange();
    this.pump();
  }

  releaseImage(entry, image) {
    image.onload = null;
    image.onerror = null;
    if (entry.image === image) {
      entry.image = null;
    }
  }

  cancelLoading(entry) {
    if (entry.controller) {
      entry.token += 1;
      entry.controller.abort();
      entry.controller = null;
      entry.status = 'idle';
      entry.priority = -Infinity;
      this.inFlight -= 1;
      return;
    }
    const image = entry.image;
    entry.token += 1;
    if (image) {
      image.onload = null;
      image.onerror = null;
      try {
        image.src = '';
      } catch (error) {
        // Some test doubles and browser image implementations reject empty URLs.
      }
    }
    entry.image = null;
    entry.status = 'idle';
    entry.priority = -Infinity;
    this.inFlight -= 1;
  }

  enforceBudget() {
    let resident = [...this.entries.values()].filter((entry) => entry.status === 'ready');
    let bytes = resident.reduce((total, entry) => total + entry.bytes, 0);
    if (
      resident.length <= this.maximumResidentTextures &&
      bytes <= this.maximumTextureBytes
    ) {
      return;
    }

    resident = resident
      .filter((entry) => entry.pinnedFrame !== this.frame)
      .sort((a, b) => a.lastUsedFrame - b.lastUsedFrame);
    for (const entry of resident) {
      if (
        this.residentTextureCount() <= this.maximumResidentTextures &&
        this.residentTextureBytes() <= this.maximumTextureBytes
      ) {
        break;
      }
      this.gl.deleteTexture(entry.texture);
      entry.texture = null;
      entry.bytes = 0;
      entry.status = 'idle';
      entry.priority = -Infinity;
    }
  }

  pruneMetadata() {
    if (this.entries.size <= this.maximumEntries) {
      return;
    }
    const removable = [...this.entries.values()]
      .filter((entry) =>
        entry.status !== 'ready' &&
        entry.status !== 'loading' &&
        entry.status !== 'queued' &&
        entry.lastDemandFrame !== this.frame
      )
      .sort((a, b) => a.lastUsedFrame - b.lastUsedFrame);
    for (const entry of removable) {
      if (this.entries.size <= this.maximumEntries) {
        break;
      }
      this.entries.delete(entry.key);
    }
  }

  residentTextureCount() {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.status === 'ready') {
        count += 1;
      }
    }
    return count;
  }

  residentTextureBytes() {
    let bytes = 0;
    for (const entry of this.entries.values()) {
      if (entry.status === 'ready') {
        bytes += entry.bytes;
      }
    }
    return bytes;
  }

  stats() {
    return {
      entries: this.entries.size,
      queued: this.queue.size,
      inFlight: this.inFlight,
      residentTextures: this.residentTextureCount(),
      residentBytes: this.residentTextureBytes()
    };
  }

  destroy() {
    this.destroyed = true;
    for (const entry of this.entries.values()) {
      if (entry.status === 'loading') {
        this.cancelLoading(entry);
      }
      if (entry.texture) {
        this.gl.deleteTexture(entry.texture);
      }
    }
    this.queue.clear();
    this.entries.clear();
  }
}

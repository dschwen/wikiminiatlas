import {
  legacyLabelBatchUrl,
  normalizeLabel,
  projectGeographicPoint
} from './label-model.mjs';

function tileKey(tile) {
  return `${tile.z}/${tile.x}/${tile.y}`;
}

function rectanglesOverlap(a, b, padding) {
  return a.left < b.right + padding &&
    a.right + padding > b.left &&
    a.top < b.bottom + padding &&
    a.bottom + padding > b.top;
}

function labelRectangle(label, projection) {
  if (label.thumbnail) {
    const left = projection.x - 6;
    const top = projection.y - 6;
    return {
      left,
      top,
      right: left + label.thumbnail.width + 7,
      bottom: top + label.thumbnail.height + 7
    };
  }
  const offsets = [
    [0, 0], [0, 0], [5, 8], [0, 0], [0, 0], [2, 2],
    [3, 3], [4, 4], [5, 5], [6, 6], [6, 6]
  ];
  const width = Math.min(210, Math.max(32, label.name.length * 6.5 + 14));
  const height = label.style === 3 ? 20 : 16;
  const [offsetX, offsetY] = offsets[label.style];
  const left = projection.x - offsetX;
  const top = projection.y - offsetY;
  return { left, top, right: left + width, bottom: top + height };
}

export class GlobeLabelLayer {
  constructor(container, {
    grid,
    labelBase = '../label.php',
    language = 'en',
    globe = 'earth',
    fetchImpl = (...args) => fetch(...args),
    maximumConcurrentRequests = 4,
    maximumCachedTiles = 256,
    maximumVisibleLabels = 80,
    retryDelayMilliseconds = 30000,
    enabled = true,
    onStateChange = () => {}
  } = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('GlobeLabelLayer requires an HTML container');
    }
    this.container = container;
    this.grid = grid;
    this.labelBase = labelBase;
    this.language = language;
    this.globe = globe;
    this.fetchImpl = fetchImpl;
    this.maximumConcurrentRequests = maximumConcurrentRequests;
    this.maximumCachedTiles = maximumCachedTiles;
    this.maximumVisibleLabels = maximumVisibleLabels;
    this.retryDelayMilliseconds = retryDelayMilliseconds;
    this.enabled = enabled;
    this.onStateChange = onStateChange;
    this.entries = new Map();
    this.queue = new Set();
    this.loads = new Set();
    this.nodes = new Map();
    this.desiredKeys = new Set();
    this.activeLabels = new Map();
    this.frame = 0;
    this.frameState = null;
    this.sourceGeneration = 0;
    this.destroyed = false;
  }

  resetResources() {
    this.sourceGeneration += 1;
    for (const load of this.loads) {
      load.controller.abort();
    }
    this.loads.clear();
    this.queue.clear();
    this.entries.clear();
    this.desiredKeys.clear();
    this.activeLabels.clear();
    this.nodes.clear();
    this.container.replaceChildren();
  }

  setLanguage(language) {
    if (typeof language !== 'string' || language.length === 0) {
      throw new TypeError('language must be a non-empty string');
    }
    if (language === this.language) {
      return;
    }
    this.resetResources();
    this.language = language;
    if (this.enabled && this.frameState) {
      this.update(this.frameState);
    }
  }

  setGlobe(globe) {
    if (typeof globe !== 'string' || globe.length === 0) {
      throw new TypeError('globe must be a non-empty string');
    }
    if (globe === this.globe) {
      return;
    }
    this.resetResources();
    this.globe = globe;
    if (this.enabled && this.frameState) {
      this.update(this.frameState);
    }
  }

  setEnabled(enabled) {
    const nextEnabled = Boolean(enabled);
    if (nextEnabled === this.enabled) {
      return;
    }
    this.enabled = nextEnabled;
    if (!nextEnabled) {
      this.resetResources();
      this.onStateChange({
        candidates: 0,
        visible: 0,
        cachedTiles: 0,
        queuedBatches: 0,
        inFlightBatches: 0
      });
    } else if (this.frameState) {
      this.update(this.frameState);
    }
  }

  entryFor(tile) {
    const normalizedTile = {
      x: this.grid.normalizeTileX(tile.x, tile.z),
      y: tile.y,
      z: tile.z
    };
    const key = tileKey(normalizedTile);
    let entry = this.entries.get(key);
    if (!entry) {
      entry = {
        key,
        tile: normalizedTile,
        status: 'idle',
        labels: [],
        lastUsedFrame: -Infinity,
        priority: -Infinity,
        retryAt: 0,
        load: null
      };
      this.entries.set(key, entry);
    }
    return entry;
  }

  update(frameState) {
    if (this.destroyed) {
      return;
    }
    this.frameState = frameState;
    if (!this.enabled) {
      return;
    }
    this.frame += 1;
    if (frameState.refinementBlocked) {
      this.render();
      return;
    }

    const desired = new Set();

    for (const tile of frameState.labelTiles || []) {
      const entry = this.entryFor(tile);
      desired.add(entry.key);
      entry.lastUsedFrame = this.frame;
      entry.priority = Math.max(entry.priority, tile.priority || 0);
      if (
        entry.status === 'idle' ||
        (entry.status === 'error' && performance.now() >= entry.retryAt)
      ) {
        entry.status = 'queued';
        this.queue.add(entry.key);
      }
    }
    this.desiredKeys = desired;

    for (const key of [...this.queue]) {
      if (!desired.has(key)) {
        const entry = this.entries.get(key);
        this.queue.delete(key);
        if (entry && entry.status === 'queued') {
          entry.status = 'idle';
          entry.priority = -Infinity;
        }
      }
    }
    for (const load of [...this.loads]) {
      if (!load.entries.some((entry) => desired.has(entry.key))) {
        load.controller.abort();
      }
    }

    this.evict();
    this.promoteReadyGeneration();
    this.pump();
    this.render();
  }

  nextBatch() {
    let first = null;
    for (const key of this.queue) {
      const entry = this.entries.get(key);
      if (!entry || entry.status !== 'queued') {
        this.queue.delete(key);
      } else if (!first || entry.priority > first.priority) {
        first = entry;
      }
    }
    if (!first) {
      return [];
    }

    const entries = [...this.queue]
      .map((key) => this.entries.get(key))
      .filter((entry) => entry && entry.status === 'queued' && entry.tile.z === first.tile.z)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);
    for (const entry of entries) {
      this.queue.delete(entry.key);
    }
    return entries;
  }

  pump() {
    while (!this.destroyed && this.loads.size < this.maximumConcurrentRequests) {
      const entries = this.nextBatch();
      if (entries.length === 0) {
        break;
      }
      this.load(entries);
    }
  }

  async load(entries) {
    const controller = new AbortController();
    const generation = this.sourceGeneration;
    const load = { controller, entries, generation };
    this.loads.add(load);
    for (const entry of entries) {
      entry.status = 'loading';
      entry.load = load;
    }

    const url = legacyLabelBatchUrl(this.labelBase, {
      grid: this.grid,
      tiles: entries.map((entry) => entry.tile),
      language: this.language,
      globe: this.globe
    });

    try {
      const response = await this.fetchImpl(url, {
        signal: controller.signal,
        credentials: 'same-origin'
      });
      if (!response.ok) {
        throw new Error(`Label request failed with HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (generation !== this.sourceGeneration || this.destroyed) {
        return;
      }
      const zoom = entries[0].tile.z;
      const labelsByTile = new Map(entries.map((entry) => [entry.key, []]));
      for (const item of payload.label || []) {
        const x = Number(item.dx);
        const serviceY = Number(item.dy);
        const dimensions = this.grid.dimensions(zoom);
        if (
          !Number.isInteger(x) ||
          !Number.isInteger(serviceY) ||
          serviceY < 0 ||
          serviceY >= dimensions.rows
        ) {
          continue;
        }
        const renderY = this.grid.renderYFromLabelService(serviceY, zoom);
        const key = tileKey({
          x: this.grid.normalizeTileX(x, zoom),
          y: renderY,
          z: zoom
        });
        if (labelsByTile.has(key)) {
          const label = normalizeLabel(item, zoom, this.grid, this.language);
          if (label.name && label.page) {
            labelsByTile.get(key).push(label);
          }
        }
      }
      for (const entry of entries) {
        entry.labels = labelsByTile.get(entry.key) || [];
        entry.status = 'ready';
        entry.load = null;
        entry.retryAt = 0;
      }
    } catch (error) {
      if (generation !== this.sourceGeneration || this.destroyed) {
        return;
      }
      const aborted = error && error.name === 'AbortError';
      for (const entry of entries) {
        entry.status = aborted ? 'idle' : 'error';
        entry.load = null;
        entry.retryAt = aborted ? 0 : performance.now() + this.retryDelayMilliseconds;
      }
    } finally {
      this.loads.delete(load);
      if (!this.destroyed && generation === this.sourceGeneration) {
        this.evict();
        this.promoteReadyGeneration();
        this.pump();
        this.render();
      }
    }
  }

  labelsForDesiredTiles() {
    const candidates = new Map();
    for (const key of this.desiredKeys) {
      const entry = this.entries.get(key);
      if (!entry || entry.status !== 'ready') {
        continue;
      }
      for (const label of entry.labels) {
        const previous = candidates.get(label.id);
        if (!previous || previous.weight < label.weight) {
          candidates.set(label.id, label);
        }
      }
    }
    return candidates;
  }

  promoteReadyGeneration() {
    if (!this.frameState || this.frameState.refinementBlocked) {
      return false;
    }
    const settled = [...this.desiredKeys].every((key) => {
      const entry = this.entries.get(key);
      return entry && (entry.status === 'ready' || entry.status === 'error');
    });
    if (!settled && this.activeLabels.size > 0) {
      return false;
    }

    const candidates = this.labelsForDesiredTiles();
    if (settled) {
      this.activeLabels = candidates;
    } else {
      for (const [id, label] of candidates) {
        this.activeLabels.set(id, label);
      }
    }
    return true;
  }

  evict() {
    if (this.entries.size <= this.maximumCachedTiles) {
      return;
    }
    const removable = [...this.entries.values()]
      .filter((entry) => entry.status !== 'loading' && entry.status !== 'queued')
      .sort((a, b) => a.lastUsedFrame - b.lastUsedFrame);
    for (const entry of removable) {
      if (this.entries.size <= this.maximumCachedTiles) {
        break;
      }
      this.entries.delete(entry.key);
    }
  }

  render() {
    if (!this.frameState) {
      return;
    }
    const projected = [];
    for (const label of this.activeLabels.values()) {
      const projection = projectGeographicPoint({
        longitude: label.longitude,
        latitude: label.latitude,
        eyeDirection: this.frameState.eyeDirection,
        distance: this.frameState.distance,
        viewProjection: this.frameState.viewProjection,
        viewportWidth: this.frameState.viewportWidth,
        viewportHeight: this.frameState.viewportHeight
      });
      if (projection) {
        projected.push({ label, projection });
      }
    }
    projected.sort((a, b) =>
      b.label.weight - a.label.weight || a.label.id.localeCompare(b.label.id)
    );

    const visible = [];
    const rectangles = [];
    for (const candidate of projected) {
      const rectangle = labelRectangle(candidate.label, candidate.projection);
      if (rectangles.some((placed) => rectanglesOverlap(rectangle, placed, 4))) {
        continue;
      }
      rectangles.push(rectangle);
      visible.push(candidate);
      if (visible.length >= this.maximumVisibleLabels) {
        break;
      }
    }

    const visibleIds = new Set();
    for (const { label, projection } of visible) {
      visibleIds.add(label.id);
      let node = this.nodes.get(label.id);
      if (!node) {
        node = document.createElement('a');
        node.className = `globe-label globe-label-${label.style}`;
        node.target = '_top';
        node.draggable = false;
        if (label.thumbnail) {
          node.className += ' globe-commons-thumbnail';
          node.href = label.thumbnail.fileUrl;
          let accessibleName = label.thumbnail.filename;
          try {
            accessibleName = decodeURIComponent(accessibleName.replace(/\+/g, ' '));
          } catch (error) {
            // Keep malformed legacy names usable instead of dropping the layer.
          }
          node.setAttribute('aria-label', accessibleName);
          const image = document.createElement('img');
          image.src = label.thumbnail.url;
          image.alt = '';
          image.width = label.thumbnail.width;
          image.height = label.thumbnail.height;
          image.draggable = false;
          node.append(image);
        } else {
          node.textContent = label.name;
          node.dir = /^(ar|fa|he|ur)(-|$)/.test(label.language) ? 'rtl' : 'ltr';
        }
        if (!label.thumbnail &&
            /^[a-z][a-z0-9-]*$/i.test(label.language) && label.page) {
          node.href = `https://${label.language}.wikipedia.org/wiki/${label.page}`;
        }
        this.container.append(node);
        this.nodes.set(label.id, node);
      }
      node.style.transform = `translate3d(${projection.x.toFixed(1)}px, ${projection.y.toFixed(1)}px, 0)`;
    }
    for (const [id, node] of this.nodes) {
      if (!visibleIds.has(id)) {
        node.remove();
        this.nodes.delete(id);
      }
    }

    this.onStateChange({
      candidates: this.activeLabels.size,
      visible: visible.length,
      cachedTiles: this.entries.size,
      queuedBatches: Math.ceil(this.queue.size / 10),
      inFlightBatches: this.loads.size
    });
  }

  destroy() {
    this.destroyed = true;
    this.resetResources();
  }
}

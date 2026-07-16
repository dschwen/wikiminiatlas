import { PlateCarreeGrid, lonLatToUnitSphere } from './plate-carree-grid.mjs';
import { BuildingRenderer } from './building-renderer.mjs';
import {
  centerSurfaceRadiansPerPixel,
  distanceAfterPinch,
  distanceAfterZoomSteps,
  distanceAfterWheel,
  rotationDegreesPerPixel,
  selectTileZoom
} from './lod.mjs';
import { lookAt, multiply, perspective } from './mat4.mjs';
import {
  ancestorsFromRoot,
  TileResourceManager
} from './tile-resource-manager.mjs';
import { selectVisibleTiles } from './tile-selection.mjs';

const DEG_TO_RAD = Math.PI / 180;
const FIELD_OF_VIEW_RADIANS = 42 * DEG_TO_RAD;
const TARGET_SCREEN_PIXELS_PER_TEXEL = 1.05;

const VERTEX_SHADER = `
  attribute vec2 a_uv;

  uniform mat4 u_viewProjection;
  uniform vec4 u_bounds;
  uniform vec2 u_uvOffset;
  uniform vec2 u_uvScale;

  varying vec2 v_uv;
  varying float v_light;

  void main() {
    float longitude = mix(u_bounds.x, u_bounds.z, a_uv.x);
    float latitude = mix(u_bounds.w, u_bounds.y, a_uv.y);
    float cosLatitude = cos(latitude);
    vec3 position = vec3(
      cosLatitude * cos(longitude),
      sin(latitude),
      -cosLatitude * sin(longitude)
    );

    vec3 lightDirection = normalize(vec3(0.8, 0.55, 1.0));
    v_light = 0.72 + 0.28 * max(dot(position, lightDirection), 0.0);
    v_uv = u_uvOffset + a_uv * u_uvScale;
    gl_Position = u_viewProjection * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_texture;

  varying vec2 v_uv;
  varying float v_light;

  void main() {
    vec4 color = texture2D(u_texture, v_uv);
    gl_FragColor = vec4(color.rgb * v_light, color.a);
  }
`;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown shader link error';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createPatchMesh(gl, segments) {
  const vertices = [];
  const indices = [];
  for (let y = 0; y <= segments; y += 1) {
    for (let x = 0; x <= segments; x += 1) {
      vertices.push(x / segments, y / segments);
    }
  }

  const rowLength = segments + 1;
  for (let y = 0; y < segments; y += 1) {
    for (let x = 0; x < segments; x += 1) {
      const topLeft = y * rowLength + x;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + rowLength;
      const bottomRight = bottomLeft + 1;
      indices.push(topLeft, bottomLeft, topRight);
      indices.push(topRight, bottomLeft, bottomRight);
    }
  }

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return { vertexBuffer, indexBuffer, indexCount: indices.length };
}

function makePlaceholder(tileSize) {
  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;
  const context = canvas.getContext('2d');
  context.fillStyle = '#253044';
  context.fillRect(0, 0, tileSize, tileSize);
  context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  context.lineWidth = 1;
  const step = Math.max(8, tileSize / 8);
  for (let offset = 0; offset <= tileSize; offset += step) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, tileSize);
    context.stroke();
    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(tileSize, offset);
    context.stroke();
  }
  return canvas;
}

function createPlaceholderTexture(gl, tileSize) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    makePlaceholder(tileSize)
  );
  return texture;
}

export function legacyRasterTileUrl(tileBase, { x, y, z }) {
  const base = tileBase.replace(/\/$/, '');
  if (z >= 7) {
    return `${base}/mapnik/${z}/${y}/tile_${y}_${x}.png`;
  }
  return `${base}/mapnik/${z}/tile_${y}_${x}.png`;
}

export class GlobeRenderer {
  constructor(canvas, {
    grid = new PlateCarreeGrid(),
    tileUrl,
    tileProducer = null,
    interactionElement = canvas,
    maximumZoom = 15,
    patchSegments = 12,
    maximumVisibleTiles = 256,
    maximumConcurrentRequests = 12,
    maximumResidentTextures = 384,
    maximumTextureBytes = 32 * 1024 * 1024,
    maximumBuildingBytes = 16 * 1024 * 1024,
    maximumLabelZoom = 13,
    maximumLabelTiles = 128,
    refinementDelayMilliseconds = 120,
    initialDistance = 3.1,
    initialLongitude = -112,
    initialLatitude = 35,
    onStateChange = () => {}
  } = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('GlobeRenderer requires a canvas element');
    }
    if (typeof tileUrl !== 'function') {
      throw new TypeError('tileUrl must be a function');
    }
    if (!(interactionElement instanceof HTMLElement)) {
      throw new TypeError('interactionElement must be an HTML element');
    }
    if (!Number.isInteger(maximumZoom) || maximumZoom < 0 || maximumZoom > 30) {
      throw new RangeError('maximumZoom must be an integer between 0 and 30');
    }

    this.canvas = canvas;
    this.interactionElement = interactionElement;
    this.grid = grid;
    this.tileUrl = tileUrl;
    this.tileProducer = tileProducer;
    this.maximumZoom = maximumZoom;
    this.maximumVisibleTiles = maximumVisibleTiles;
    this.configuredMaximumLabelZoom = maximumLabelZoom;
    this.maximumLabelZoom = Math.min(maximumZoom, this.configuredMaximumLabelZoom);
    this.maximumLabelTiles = maximumLabelTiles;
    this.refinementDelayMilliseconds = refinementDelayMilliseconds;
    this.onStateChange = onStateChange;
    this.longitude = Number.isFinite(initialLongitude) ? initialLongitude : -112;
    this.latitude = Number.isFinite(initialLatitude)
      ? clamp(initialLatitude, -89, 89)
      : 35;
    this.distance = Number.isFinite(initialDistance)
      ? clamp(initialDistance, 1.0005, 51)
      : 3.1;
    this.frame = null;
    this.refinementTimer = null;
    this.refinementBlocked = false;
    this.destroyed = false;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      depth: true,
      powerPreference: 'high-performance'
    });
    if (!gl) {
      throw new Error('WebGL is not available');
    }
    this.gl = gl;
    this.program = createProgram(gl);
    this.buildingRenderer = new BuildingRenderer(gl);
    this.meshes = [
      { maximumZoom: 1, mesh: createPatchMesh(gl, patchSegments) },
      { maximumZoom: 4, mesh: createPatchMesh(gl, Math.min(6, patchSegments)) },
      { maximumZoom: Infinity, mesh: createPatchMesh(gl, Math.min(2, patchSegments)) }
    ];
    this.placeholderTexture = createPlaceholderTexture(gl, grid.tileSize);
    this.locations = {
      uv: gl.getAttribLocation(this.program, 'a_uv'),
      viewProjection: gl.getUniformLocation(this.program, 'u_viewProjection'),
      bounds: gl.getUniformLocation(this.program, 'u_bounds'),
      uvOffset: gl.getUniformLocation(this.program, 'u_uvOffset'),
      uvScale: gl.getUniformLocation(this.program, 'u_uvScale'),
      texture: gl.getUniformLocation(this.program, 'u_texture')
    };
    this.resourceOptions = {
      gl,
      tileKey: (x, y, z) => grid.tileKey(x, y, z),
      tileSize: grid.tileSize,
      onChange: () => this.requestRender(),
      uploadAuxiliary: (mesh) => this.buildingRenderer.upload(mesh),
      deleteAuxiliary: (resource) => this.buildingRenderer.delete(resource),
      maximumConcurrentRequests,
      maximumResidentTextures,
      maximumTextureBytes,
      maximumAuxiliaryBytes: maximumBuildingBytes
    };
    this.resources = this.createResourceManager(tileUrl, tileProducer);

    gl.clearColor(0.015, 0.025, 0.055, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.installControls();
    this.resizeObserver = new ResizeObserver(() => this.requestRender());
    this.resizeObserver.observe(canvas);
    this.requestRender();
  }

  createResourceManager(tileUrl, tileProducer = null) {
    return new TileResourceManager({
      ...this.resourceOptions,
      tileUrl,
      tileProducer
    });
  }

  setTileSource({
    tileUrl,
    tileProducer = null,
    maximumZoom = this.maximumZoom
  }) {
    if (typeof tileUrl !== 'function') {
      throw new TypeError('tileUrl must be a function');
    }
    if (!Number.isInteger(maximumZoom) || maximumZoom < 0 || maximumZoom > 30) {
      throw new RangeError('maximumZoom must be an integer between 0 and 30');
    }
    const previousResources = this.resources;
    this.tileUrl = tileUrl;
    this.tileProducer = tileProducer;
    this.maximumZoom = maximumZoom;
    this.maximumLabelZoom = Math.min(maximumZoom, this.configuredMaximumLabelZoom);
    this.resources = this.createResourceManager(tileUrl, tileProducer);
    previousResources.destroy();
    this.deferRefinement();
    this.requestRender();
  }

  zoomBySteps(steps) {
    this.distance = distanceAfterZoomSteps({
      distance: this.distance,
      steps
    });
    this.deferRefinement();
    this.requestRender();
  }

  centerOn(longitude, latitude) {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      throw new TypeError('center coordinates must be finite numbers');
    }
    this.longitude = longitude;
    this.latitude = clamp(latitude, -89, 89);
    this.deferRefinement();
    this.requestRender();
  }

  installControls() {
    const pointers = new Map();
    let gesture = null;
    let gestureMoved = false;
    let suppressLabelClicksUntil = -Infinity;

    const midpoint = (first, second) => ({
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2
    });

    const startGesture = () => {
      const active = [...pointers.entries()];
      if (active.length === 0) {
        gesture = null;
        this.canvas.classList.remove('dragging');
        return;
      }

      this.canvas.classList.add('dragging');
      if (active.length === 1) {
        const [pointerId, point] = active[0];
        gesture = {
          mode: 'orbit',
          pointerId,
          point,
          longitude: this.longitude,
          latitude: this.latitude,
          distance: this.distance
        };
        return;
      }

      const [firstEntry, secondEntry] = active;
      const [firstId, first] = firstEntry;
      const [secondId, second] = secondEntry;
      gesture = {
        mode: 'pinch',
        pointerIds: [firstId, secondId],
        span: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
        center: midpoint(first, second),
        longitude: this.longitude,
        latitude: this.latitude,
        distance: this.distance
      };
      gestureMoved = true;
    };

    this.onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      if (pointers.size === 0) {
        gestureMoved = false;
      }
      const captureElement = event.target && event.target.setPointerCapture
        ? event.target
        : this.interactionElement;
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        captureElement,
        label: event.target && event.target.closest
          ? event.target.closest('.globe-label')
          : null
      });
      try {
        captureElement.setPointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture can fail when a browser retires the pointer immediately.
      }
      startGesture();
      this.deferRefinement();
    };

    this.onPointerMove = (event) => {
      if (!pointers.has(event.pointerId) || gesture === null) {
        return;
      }
      event.preventDefault();
      const previous = pointers.get(event.pointerId);
      const point = {
        ...previous,
        x: event.clientX,
        y: event.clientY
      };
      pointers.set(event.pointerId, point);
      if (Math.hypot(point.x - point.startX, point.y - point.startY) > 6) {
        gestureMoved = true;
      }
      this.deferRefinement();

      if (gesture.mode === 'pinch') {
        const first = pointers.get(gesture.pointerIds[0]);
        const second = pointers.get(gesture.pointerIds[1]);
        if (!first || !second) {
          startGesture();
          return;
        }

        const currentSpan = Math.max(
          1,
          Math.hypot(second.x - first.x, second.y - first.y)
        );
        const currentCenter = midpoint(first, second);
        const degreesPerPixel = rotationDegreesPerPixel({
          viewportHeight: Math.max(1, this.canvas.clientHeight),
          distance: gesture.distance,
          fieldOfViewRadians: FIELD_OF_VIEW_RADIANS
        });
        this.distance = distanceAfterPinch({
          distance: gesture.distance,
          startSpan: gesture.span,
          currentSpan
        });
        this.longitude = gesture.longitude -
          (currentCenter.x - gesture.center.x) * degreesPerPixel;
        this.latitude = clamp(
          gesture.latitude + (currentCenter.y - gesture.center.y) * degreesPerPixel,
          -89,
          89
        );
        this.requestRender();
        return;
      }

      if (gesture.pointerId !== event.pointerId) {
        return;
      }
      const degreesPerPixel = rotationDegreesPerPixel({
        viewportHeight: Math.max(1, this.canvas.clientHeight),
        distance: gesture.distance,
        fieldOfViewRadians: FIELD_OF_VIEW_RADIANS
      });
      this.longitude = gesture.longitude -
        (point.x - gesture.point.x) * degreesPerPixel;
      this.latitude = clamp(
        gesture.latitude + (point.y - gesture.point.y) * degreesPerPixel,
        -89,
        89
      );
      this.requestRender();
    };

    this.onPointerUp = (event) => {
      if (!pointers.has(event.pointerId)) {
        return;
      }
      const pointer = pointers.get(event.pointerId);
      if (gestureMoved && pointer.label) {
        suppressLabelClicksUntil = performance.now() + 500;
      }
      pointers.delete(event.pointerId);
      if (pointer.captureElement.hasPointerCapture(event.pointerId)) {
        pointer.captureElement.releasePointerCapture(event.pointerId);
      }
      startGesture();
      this.deferRefinement();
    };

    this.onClick = (event) => {
      const label = event.target && event.target.closest
        ? event.target.closest('.globe-label')
        : null;
      if (label && performance.now() <= suppressLabelClicksUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    this.onWheel = (event) => {
      event.preventDefault();
      this.distance = distanceAfterWheel({
        distance: this.distance,
        deltaY: event.deltaY
      });
      this.deferRefinement();
      this.requestRender();
    };

    this.interactionElement.addEventListener('pointerdown', this.onPointerDown);
    this.interactionElement.addEventListener('pointermove', this.onPointerMove);
    this.interactionElement.addEventListener('pointerup', this.onPointerUp);
    this.interactionElement.addEventListener('pointercancel', this.onPointerUp);
    this.interactionElement.addEventListener('click', this.onClick, true);
    this.interactionElement.addEventListener('wheel', this.onWheel, { passive: false });
  }

  tileZoom() {
    return selectTileZoom({
      viewportHeight: this.canvas.height,
      distance: this.distance,
      fieldOfViewRadians: FIELD_OF_VIEW_RADIANS,
      baseTileDegrees: this.grid.angularTileSize(0),
      tileSize: this.grid.tileSize,
      maximumZoom: this.maximumZoom,
      targetScreenPixelsPerTexel: TARGET_SCREEN_PIXELS_PER_TEXEL
    });
  }

  deferRefinement() {
    this.refinementBlocked = true;
    if (this.refinementTimer !== null) {
      clearTimeout(this.refinementTimer);
    }
    this.refinementTimer = setTimeout(() => {
      this.refinementTimer = null;
      this.refinementBlocked = false;
      this.requestRender();
    }, this.refinementDelayMilliseconds);
  }

  meshForZoom(zoom) {
    return this.meshes.find((tier) => zoom <= tier.maximumZoom).mesh;
  }

  bindMesh(mesh) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.enableVertexAttribArray(this.locations.uv);
    gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
  }

  labelTilesFor(renderTiles) {
    const labelTiles = new Map();
    for (const tile of renderTiles) {
      const zoom = Math.min(tile.z, this.maximumLabelZoom);
      const divisor = 2 ** (tile.z - zoom);
      const labelTile = {
        x: Math.floor(tile.x / divisor),
        y: Math.floor(tile.y / divisor),
        z: zoom,
        priority: tile.projectedPixels * divisor
      };
      const key = this.grid.tileKey(labelTile.x, labelTile.y, labelTile.z);
      const previous = labelTiles.get(key);
      if (!previous || previous.priority < labelTile.priority) {
        labelTiles.set(key, labelTile);
      }
    }
    return [...labelTiles.values()]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.maximumLabelTiles);
  }

  resizeCanvas() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(this.canvas.clientWidth * devicePixelRatio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * devicePixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  requestRender() {
    if (this.destroyed || this.frame !== null) {
      return;
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.render();
    });
  }

  render() {
    this.resizeCanvas();
    const gl = this.gl;
    const eyeDirection = lonLatToUnitSphere(this.longitude, this.latitude);
    const eye = eyeDirection.map((component) => component * this.distance);
    const projection = perspective(
      FIELD_OF_VIEW_RADIANS,
      this.canvas.width / this.canvas.height,
      Math.max(0.00005, (this.distance - 1) * 0.1),
      this.distance + 1.1
    );
    const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
    const viewProjection = multiply(projection, view);
    const tileZoom = this.tileZoom();
    const zoom = tileZoom.zoom;
    const selection = selectVisibleTiles({
      grid: this.grid,
      maximumZoom: zoom,
      eyeDirection,
      distance: this.distance,
      viewportWidth: this.canvas.width,
      viewportHeight: this.canvas.height,
      fieldOfViewRadians: FIELD_OF_VIEW_RADIANS,
      desiredTilePixels: this.grid.tileSize * TARGET_SCREEN_PIXELS_PER_TEXEL,
      maximumLeafTiles: this.maximumVisibleTiles
    });
    const tiles = selection.tiles.sort((a, b) => a.z - b.z);
    const renderedZooms = tiles.map((tile) => tile.z);
    const labelTiles = this.labelTilesFor(tiles);

    this.resources.beginFrame();
    const draws = [];
    let readyCount = 0;
    let fallbackCount = 0;
    let placeholderCount = 0;
    const buildingResources = new Map();
    for (const tile of tiles) {
      let resolved = this.resources.resolve(tile);
      const ancestry = ancestorsFromRoot(tile);

      if (!this.refinementBlocked) {
        const nextZoom = resolved ? resolved.entry.tile.z + 1 : 0;
        if (nextZoom <= tile.z) {
          this.resources.demand(ancestry[nextZoom], {
            priority: 100000 - nextZoom * 1000 + tile.projectedPixels,
            pin: nextZoom === 0
          });
        }
      } else if (!resolved) {
        this.resources.demand(ancestry[0], {
          priority: 100000 + tile.projectedPixels,
          pin: true
        });
      }

      resolved = this.resources.resolve(tile);
      if (!resolved) {
        placeholderCount += 1;
      } else if (resolved.fallbackLevels > 0) {
        fallbackCount += 1;
      } else {
        readyCount += 1;
        if (resolved.entry.auxiliary) {
          buildingResources.set(resolved.entry.key, resolved.entry.auxiliary);
        }
      }
      draws.push({ tile, resolved });
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.locations.viewProjection, false, viewProjection);
    gl.uniform1i(this.locations.texture, 0);

    let activeMesh = null;
    for (const { tile, resolved } of draws) {
      const mesh = this.meshForZoom(tile.z);
      if (mesh !== activeMesh) {
        this.bindMesh(mesh);
        activeMesh = mesh;
      }
      const transform = resolved
        ? resolved.transform
        : { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(
        gl.TEXTURE_2D,
        resolved ? resolved.entry.texture : this.placeholderTexture
      );
      gl.uniform4f(
        this.locations.bounds,
        tile.bounds.west * DEG_TO_RAD,
        tile.bounds.south * DEG_TO_RAD,
        tile.bounds.east * DEG_TO_RAD,
        tile.bounds.north * DEG_TO_RAD
      );
      gl.uniform2f(this.locations.uvOffset, transform.offsetX, transform.offsetY);
      gl.uniform2f(this.locations.uvScale, transform.scaleX, transform.scaleY);
      gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    this.buildingRenderer.draw([...buildingResources.values()], viewProjection);
    this.resources.endFrame();
    const resourceStats = this.resources.stats();

    this.onStateChange({
      latitude: this.latitude,
      longitude: this.grid.normalizeLongitude(this.longitude),
      distance: this.distance,
      zoom,
      minimumRenderedZoom: renderedZooms.length ? Math.min(...renderedZooms) : 0,
      maximumRenderedZoom: renderedZooms.length ? Math.max(...renderedZooms) : 0,
      frontTilePixels: tileZoom.frontTilePixels,
      visibleTiles: tiles.length,
      readyTiles: readyCount,
      fallbackTiles: fallbackCount,
      placeholderTiles: placeholderCount,
      drawCalls: draws.length,
      buildingDrawCalls: buildingResources.size,
      visibleBuildings: [...buildingResources.values()].reduce(
        (total, resource) => total + resource.buildingCount,
        0
      ),
      visitedTileNodes: selection.visitedNodes,
      tileBudgetLimited: selection.budgetLimited,
      refinementBlocked: this.refinementBlocked,
      labelTiles,
      eyeDirection,
      viewProjection,
      viewportWidth: Math.max(1, this.canvas.clientWidth),
      viewportHeight: Math.max(1, this.canvas.clientHeight),
      centerRadiansPerCssPixel: centerSurfaceRadiansPerPixel({
        viewportHeight: Math.max(1, this.canvas.clientHeight),
        distance: this.distance,
        fieldOfViewRadians: FIELD_OF_VIEW_RADIANS
      }),
      ...resourceStats
    });
  }

  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
    }
    if (this.refinementTimer !== null) {
      clearTimeout(this.refinementTimer);
    }
    this.resizeObserver.disconnect();
    this.interactionElement.removeEventListener('pointerdown', this.onPointerDown);
    this.interactionElement.removeEventListener('pointermove', this.onPointerMove);
    this.interactionElement.removeEventListener('pointerup', this.onPointerUp);
    this.interactionElement.removeEventListener('pointercancel', this.onPointerUp);
    this.interactionElement.removeEventListener('click', this.onClick, true);
    this.interactionElement.removeEventListener('wheel', this.onWheel);

    const gl = this.gl;
    this.resources.destroy();
    this.buildingRenderer.destroy();
    gl.deleteTexture(this.placeholderTexture);
    for (const { mesh } of this.meshes) {
      gl.deleteBuffer(mesh.vertexBuffer);
      gl.deleteBuffer(mesh.indexBuffer);
    }
    gl.deleteProgram(this.program);
  }
}

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
  parentTile,
  TileResourceManager
} from './tile-resource-manager.mjs';
import { selectVisibleTiles } from './tile-selection.mjs';

const DEG_TO_RAD = Math.PI / 180;
const FIELD_OF_VIEW_RADIANS = 42 * DEG_TO_RAD;
// Keep selected patches roughly twice the previous side length. Besides
// reducing request/draw pressure, this avoids 128px source tiles shrinking to
// about 64 CSS pixels on common high-density displays.
const TARGET_SCREEN_PIXELS_PER_TEXEL = 2.1;
export const DEFAULT_LIGHT_DIRECTION = Object.freeze([0.8, 0.55, 1.0]);

const VERTEX_SHADER = `
  attribute vec2 a_uv;

  uniform mat4 u_viewProjection;
  uniform vec4 u_bounds;
  uniform vec2 u_uvOffset;
  uniform vec2 u_uvScale;
  uniform mediump vec3 u_lightDirection;
  varying vec2 v_uv;
  varying vec3 v_surfaceNormal;
  varying float v_legacyLight;

  void main() {
    float longitude = mix(u_bounds.x, u_bounds.z, a_uv.x);
    float latitude = mix(u_bounds.w, u_bounds.y, a_uv.y);
    float cosLatitude = cos(latitude);
    vec3 position = vec3(
      cosLatitude * cos(longitude),
      sin(latitude),
      -cosLatitude * sin(longitude)
    );

    v_surfaceNormal = position;
    v_legacyLight = 0.72 + 0.28 * max(dot(position, u_lightDirection), 0.0);
    v_uv = u_uvOffset + a_uv * u_uvScale;
    gl_Position = u_viewProjection * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform mediump vec3 u_lightDirection;
  uniform float u_realisticLighting;

  varying vec2 v_uv;
  varying vec3 v_surfaceNormal;
  varying float v_legacyLight;

  void main() {
    vec4 color = texture2D(u_texture, v_uv);
    float incidence = dot(normalize(v_surfaceNormal), u_lightDirection);
    float sunVisible = smoothstep(-0.006, 0.006, incidence);
    float dayLight = pow(max(incidence, 0.0), 0.85) * sunVisible;
    float realisticLight = 0.045 + 0.955 * dayLight;
    float light = mix(v_legacyLight, realisticLight, u_realisticLighting);
    gl_FragColor = vec4(color.rgb * light, color.a);
  }
`;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function normalizeLightDirection(direction) {
  if (!Array.isArray(direction) && !ArrayBuffer.isView(direction)) {
    throw new TypeError('light direction must be a three-component vector');
  }
  if (direction.length !== 3 || ![...direction].every(Number.isFinite)) {
    throw new TypeError('light direction must contain three finite components');
  }
  const length = Math.hypot(...direction);
  if (length === 0) {
    throw new RangeError('light direction cannot be zero');
  }
  return [...direction].map((component) => component / length);
}

export function distanceForAngularRadius({
  angularRadius,
  viewportWidth,
  viewportHeight,
  fieldOfViewRadians = FIELD_OF_VIEW_RADIANS,
  padding = 0.18,
  minimumAltitude = 0.0005
}) {
  if (!Number.isFinite(angularRadius) || angularRadius < 0) {
    throw new RangeError('angular radius must be a non-negative finite number');
  }
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0 ||
      !Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    throw new RangeError('viewport dimensions must be positive');
  }
  if (!Number.isFinite(minimumAltitude) || minimumAltitude <= 0) {
    throw new RangeError('minimumAltitude must be a positive finite number');
  }
  const verticalHalfAngle = fieldOfViewRadians / 2;
  const horizontalHalfAngle = Math.atan(
    Math.tan(verticalHalfAngle) * viewportWidth / viewportHeight
  );
  const availableHalfAngle = Math.min(verticalHalfAngle, horizontalHalfAngle) *
    (1 - clamp(padding, 0, 0.8));
  const radius = Math.min(angularRadius, Math.PI / 2 - 0.001);
  return clamp(
    Math.cos(radius) + Math.sin(radius) / Math.tan(availableHalfAngle),
    1 + minimumAltitude,
    51
  );
}

export function pointerIsOutsideInteraction(event, interactionElement) {
  if (event.pointerType === 'mouse' ||
      !interactionElement ||
      typeof interactionElement.getBoundingClientRect !== 'function') {
    return false;
  }
  const bounds = interactionElement.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX >= bounds.right ||
    event.clientY < bounds.top || event.clientY >= bounds.bottom;
}

export function pointerNeedsViewportCapture({
  interactiveOverlay = false,
  activePointerCount = 1,
  moved = false
}) {
  return !interactiveOverlay || activePointerCount > 1 || moved;
}

export function lostPointerCaptureEndsGesture(event, interactionElement) {
  return event.target === interactionElement ||
    typeof interactionElement.hasPointerCapture !== 'function' ||
    !interactionElement.hasPointerCapture(event.pointerId);
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

export function collectBuildingResources(draws) {
  const entries = new Map();
  for (const { resolved } of draws) {
    if (resolved && resolved.entry.auxiliary) {
      entries.set(resolved.entry.key, resolved.entry);
    }
  }
  const selected = [];
  const ordered = [...entries.values()].sort(
    (first, second) => first.tile.z - second.tile.z
  );
  for (const entry of ordered) {
    const coveredByAncestor = selected.some((ancestor) => {
      if (ancestor.tile.z >= entry.tile.z) return false;
      const divisor = 2 ** (entry.tile.z - ancestor.tile.z);
      return Math.floor(entry.tile.x / divisor) === ancestor.tile.x &&
        Math.floor(entry.tile.y / divisor) === ancestor.tile.y;
    });
    if (!coveredByAncestor) selected.push(entry);
  }
  return selected.map((entry) => entry.auxiliary);
}

export function tileDemandsFor(
  tile,
  resolved,
  refinementBlocked = false,
  requestLeafDuringInteraction = false
) {
  const ancestry = ancestorsFromRoot(tile);
  const root = ancestry[0];
  const demands = [];

  // Establish coverage first so a direct high-zoom link never exposes the
  // procedural placeholder longer than necessary.
  if (!resolved) {
    demands.push({
      tile: root,
      priority: 200000 + tile.projectedPixels,
      pin: true
    });
  }

  // Once interaction settles, skip disposable intermediate generations and
  // request the selected leaf directly. The closest resident ancestor remains
  // visible until this resource is ready.
  if (
    (!refinementBlocked || requestLeafDuringInteraction) &&
    (!resolved || resolved.fallbackLevels > 0)
  ) {
    const rootIsLeaf = root.x === tile.x && root.y === tile.y && root.z === tile.z;
    if (!rootIsLeaf || resolved) {
      demands.push({
        tile: { x: tile.x, y: tile.y, z: tile.z },
        priority: 100000 + tile.projectedPixels,
        pin: true
      });
    }
  }

  return demands;
}

export function parentPrefetchDemandFor(tile) {
  const parent = parentTile(tile);
  return parent
    ? {
        tile: parent,
        priority: 50000 + tile.projectedPixels,
        pin: true
      }
    : null;
}

export function transitionChildrenFor(tile, grid) {
  const childZoom = tile.z + 1;
  const childX = tile.x * 2;
  const childY = tile.y * 2;
  return [
    { x: childX, y: childY, z: childZoom },
    { x: childX + 1, y: childY, z: childZoom },
    { x: childX, y: childY + 1, z: childZoom },
    { x: childX + 1, y: childY + 1, z: childZoom }
  ].map((child) => ({
    ...child,
    bounds: grid.tileBounds(child.x, child.y, child.z),
    projectedPixels: tile.projectedPixels / 2
  }));
}

export class GlobeRenderer {
  constructor(canvas, {
    grid = new PlateCarreeGrid(),
    tileUrl,
    tileProducer = null,
    interactionElement = canvas,
    maximumZoom = 15,
    minimumCameraAltitude = 0.0005,
    patchSegments = 12,
    maximumVisibleTiles = 256,
    maximumConcurrentRequests = 12,
    maximumResidentTextures = 768,
    maximumTextureBytes = 64 * 1024 * 1024,
    maximumBuildingBytes = 32 * 1024 * 1024,
    maximumLabelZoom = 13,
    maximumLabelTiles = 128,
    refinementDelayMilliseconds = 120,
    initialDistance = 3.1,
    initialLongitude = -112,
    initialLatitude = 35,
    lightDirection = DEFAULT_LIGHT_DIRECTION,
    realisticLighting = false,
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
    if (!Number.isFinite(minimumCameraAltitude) || minimumCameraAltitude <= 0) {
      throw new RangeError('minimumCameraAltitude must be a positive finite number');
    }

    this.canvas = canvas;
    this.interactionElement = interactionElement;
    this.grid = grid;
    this.tileUrl = tileUrl;
    this.tileProducer = tileProducer;
    this.maximumZoom = maximumZoom;
    this.minimumCameraAltitude = minimumCameraAltitude;
    this.maximumVisibleTiles = maximumVisibleTiles;
    this.maximumTransitionTiles = maximumVisibleTiles * 2;
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
      ? clamp(initialDistance, 1 + this.minimumCameraAltitude, 51)
      : 3.1;
    this.lightDirection = normalizeLightDirection(lightDirection);
    this.realisticLighting = Boolean(realisticLighting);
    this.frame = null;
    this.refinementTimer = null;
    this.refinementBlocked = false;
    this.lastTileZoom = null;
    this.zoomTransitionDirection = 0;
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
      lightDirection: gl.getUniformLocation(this.program, 'u_lightDirection'),
      realisticLighting: gl.getUniformLocation(this.program, 'u_realisticLighting'),
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
    maximumZoom = this.maximumZoom,
    minimumCameraAltitude = this.minimumCameraAltitude
  }) {
    if (typeof tileUrl !== 'function') {
      throw new TypeError('tileUrl must be a function');
    }
    if (!Number.isInteger(maximumZoom) || maximumZoom < 0 || maximumZoom > 30) {
      throw new RangeError('maximumZoom must be an integer between 0 and 30');
    }
    if (!Number.isFinite(minimumCameraAltitude) || minimumCameraAltitude <= 0) {
      throw new RangeError('minimumCameraAltitude must be a positive finite number');
    }
    const previousResources = this.resources;
    this.tileUrl = tileUrl;
    this.tileProducer = tileProducer;
    this.maximumZoom = maximumZoom;
    this.minimumCameraAltitude = minimumCameraAltitude;
    this.distance = Math.max(this.distance, 1 + this.minimumCameraAltitude);
    this.maximumLabelZoom = Math.min(maximumZoom, this.configuredMaximumLabelZoom);
    this.resources = this.createResourceManager(tileUrl, tileProducer);
    this.lastTileZoom = null;
    this.zoomTransitionDirection = 0;
    previousResources.destroy();
    this.deferRefinement();
    this.requestRender();
  }

  setLightDirection(direction) {
    this.lightDirection = normalizeLightDirection(direction);
    this.requestRender();
  }

  setRealisticLighting(enabled) {
    this.realisticLighting = Boolean(enabled);
    this.requestRender();
  }

  zoomBySteps(steps) {
    this.distance = distanceAfterZoomSteps({
      distance: this.distance,
      steps,
      minimumAltitude: this.minimumCameraAltitude
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

  fitView({ longitude, latitude, angularRadius }, options = {}) {
    if (![longitude, latitude, angularRadius].every(Number.isFinite)) {
      throw new TypeError('fit view requires finite center coordinates and radius');
    }
    this.longitude = longitude;
    this.latitude = clamp(latitude, -89, 89);
    this.distance = distanceForAngularRadius({
      angularRadius,
      viewportWidth: Math.max(1, this.canvas.clientWidth),
      viewportHeight: Math.max(1, this.canvas.clientHeight),
      minimumAltitude: this.minimumCameraAltitude,
      ...options
    });
    this.deferRefinement();
    this.requestRender();
  }

  installControls() {
    const pointers = new Map();
    let gesture = null;
    let gestureMoved = false;
    let suppressOverlayClicksUntil = -Infinity;

    const midpoint = (first, second) => ({
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2
    });

    const capturePointer = (pointerId) => {
      try {
        if (typeof this.interactionElement.hasPointerCapture !== 'function' ||
            !this.interactionElement.hasPointerCapture(pointerId)) {
          this.interactionElement.setPointerCapture(pointerId);
        }
      } catch (error) {
        // Pointer capture can fail when a browser retires the pointer immediately.
      }
    };

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
      for (const [pointerId] of active) {
        if (pointerNeedsViewportCapture({
          interactiveOverlay: pointers.get(pointerId).interactiveOverlay,
          activePointerCount: active.length
        })) {
          capturePointer(pointerId);
        }
      }
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

    const finishPointer = (event, { releaseCapture = true } = {}) => {
      if (!pointers.has(event.pointerId)) {
        return;
      }
      const pointer = pointers.get(event.pointerId);
      if (gestureMoved && pointer.interactiveOverlay) {
        suppressOverlayClicksUntil = performance.now() + 500;
      }
      pointers.delete(event.pointerId);
      if (releaseCapture) {
        try {
          if (typeof this.interactionElement.hasPointerCapture === 'function' &&
              this.interactionElement.hasPointerCapture(event.pointerId)) {
            this.interactionElement.releasePointerCapture(event.pointerId);
          }
        } catch (error) {
          // The browser may retire a captured pointer while the frame is leaving.
        }
      }
      startGesture();
      this.deferRefinement();
    };

    this.cancelActiveGesture = () => {
      if (pointers.size === 0 && gesture === null) return;
      const pointerIds = [...pointers.keys()];
      pointers.clear();
      gesture = null;
      this.canvas.classList.remove('dragging');
      for (const pointerId of pointerIds) {
        try {
          if (typeof this.interactionElement.hasPointerCapture === 'function' &&
              this.interactionElement.hasPointerCapture(pointerId)) {
            this.interactionElement.releasePointerCapture(pointerId);
          }
        } catch (error) {
          // Lost frames can invalidate capture before cleanup reaches it.
        }
      }
      if (!this.destroyed) this.deferRefinement();
    };

    this.onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      if (pointers.size === 0) {
        gestureMoved = false;
      }
      const interactiveOverlay = event.target && event.target.closest
        ? event.target.closest('.globe-label, .globe-marker')
        : null;
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        interactiveOverlay
      });
      if (pointerNeedsViewportCapture({
        interactiveOverlay,
        activePointerCount: pointers.size
      })) {
        capturePointer(event.pointerId);
      }
      startGesture();
      this.deferRefinement();
    };

    this.onPointerMove = (event) => {
      if (!pointers.has(event.pointerId) || gesture === null) {
        return;
      }
      if (pointerIsOutsideInteraction(event, this.interactionElement)) {
        finishPointer(event);
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
      const pointerMoved = Math.hypot(
        point.x - point.startX,
        point.y - point.startY
      ) > 6;
      if (pointerMoved) {
        gestureMoved = true;
      }
      if (pointerNeedsViewportCapture({
        interactiveOverlay: point.interactiveOverlay,
        activePointerCount: pointers.size,
        moved: pointerMoved
      })) {
        capturePointer(event.pointerId);
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
          currentSpan,
          minimumAltitude: this.minimumCameraAltitude
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
      finishPointer(event);
    };

    this.onLostPointerCapture = (event) => {
      if (!lostPointerCaptureEndsGesture(event, this.interactionElement)) {
        return;
      }
      finishPointer(event, { releaseCapture: false });
    };

    this.onPointerOut = (event) => {
      if (event.pointerType === 'mouse' || !pointers.has(event.pointerId)) return;
      if (event.relatedTarget && this.interactionElement.contains(event.relatedTarget)) {
        return;
      }
      finishPointer(event);
    };

    this.onClick = (event) => {
      const interactiveOverlay = event.target && event.target.closest
        ? event.target.closest('.globe-label, .globe-marker')
        : null;
      if (interactiveOverlay && performance.now() <= suppressOverlayClicksUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    this.onWheel = (event) => {
      event.preventDefault();
      this.distance = distanceAfterWheel({
        distance: this.distance,
        deltaY: event.deltaY,
        minimumAltitude: this.minimumCameraAltitude
      });
      this.deferRefinement();
      this.requestRender();
    };

    this.interactionElement.addEventListener('pointerdown', this.onPointerDown);
    this.interactionElement.addEventListener('pointermove', this.onPointerMove);
    this.interactionElement.addEventListener('pointerup', this.onPointerUp);
    this.interactionElement.addEventListener('pointercancel', this.onPointerUp);
    this.interactionElement.addEventListener('lostpointercapture', this.onLostPointerCapture);
    this.interactionElement.addEventListener('pointerout', this.onPointerOut);
    this.interactionElement.addEventListener('pointerleave', this.onPointerOut);
    this.interactionElement.addEventListener('touchcancel', this.cancelActiveGesture);
    this.interactionElement.addEventListener('click', this.onClick, true);
    this.interactionElement.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('blur', this.cancelActiveGesture);
    window.addEventListener('pagehide', this.cancelActiveGesture);
    document.addEventListener('visibilitychange', this.cancelActiveGesture);
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
      Math.max(0.000005, (this.distance - 1) * 0.1),
      this.distance + 1.1
    );
    const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
    const viewProjection = multiply(projection, view);
    const tileZoom = this.tileZoom();
    const zoom = tileZoom.zoom;
    if (this.lastTileZoom !== null) {
      if (zoom < this.lastTileZoom) {
        this.zoomTransitionDirection = -1;
      } else if (zoom > this.lastTileZoom) {
        this.zoomTransitionDirection = 1;
      }
    }
    this.lastTileZoom = zoom;
    const zoomingOut = this.zoomTransitionDirection < 0;
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
    const baseDraws = [];
    let readyCount = 0;
    let fallbackCount = 0;
    let placeholderCount = 0;
    for (const tile of tiles) {
      let resolved = this.resources.resolve(tile);

      for (const demand of tileDemandsFor(
        tile,
        resolved,
        this.refinementBlocked,
        zoomingOut
      )) {
        this.resources.demand(demand.tile, demand);
      }
      const parentDemand = parentPrefetchDemandFor(tile);
      if (parentDemand) this.resources.demand(parentDemand.tile, parentDemand);

      resolved = this.resources.resolve(tile);
      if (!resolved) {
        placeholderCount += 1;
      } else if (resolved.fallbackLevels > 0) {
        fallbackCount += 1;
      } else {
        readyCount += 1;
      }
      baseDraws.push({ tile, resolved });
    }
    const expandableKeys = new Set();
    if (zoomingOut) {
      let remainingTransitionSlots = this.maximumTransitionTiles - baseDraws.length;
      const candidates = baseDraws
        .filter(({ tile, resolved }) =>
          (!resolved || resolved.fallbackLevels > 0) &&
          this.resources.recentReadyChildren(tile).length > 0
        )
        .sort((first, second) =>
          second.tile.projectedPixels - first.tile.projectedPixels
        );
      for (const { tile } of candidates) {
        if (remainingTransitionSlots < 3) break;
        expandableKeys.add(this.grid.tileKey(tile.x, tile.y, tile.z));
        remainingTransitionSlots -= 3;
      }
    }
    const draws = baseDraws.flatMap(({ tile, resolved }) => {
      const key = this.grid.tileKey(tile.x, tile.y, tile.z);
      if (!expandableKeys.has(key)) return [{ tile, resolved }];
      return transitionChildrenFor(tile, this.grid).map((child) => ({
        tile: child,
        resolved: this.resources.resolve(child)
      }));
    });
    if (zoomingOut && readyCount === tiles.length) {
      this.zoomTransitionDirection = 0;
    }
    // Keep the closest ready building mesh visible while a more detailed
    // surface tile is loading, just as we do for its texture.
    const buildingResources = collectBuildingResources(draws);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.locations.viewProjection, false, viewProjection);
    gl.uniform3fv(this.locations.lightDirection, this.lightDirection);
    gl.uniform1f(this.locations.realisticLighting, this.realisticLighting ? 1 : 0);
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
    this.buildingRenderer.draw(
      buildingResources,
      viewProjection,
      this.lightDirection,
      this.realisticLighting
    );
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
      buildingDrawCalls: buildingResources.length,
      visibleBuildings: buildingResources.reduce(
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
    this.interactionElement.removeEventListener(
      'lostpointercapture',
      this.onLostPointerCapture
    );
    this.interactionElement.removeEventListener('pointerout', this.onPointerOut);
    this.interactionElement.removeEventListener('pointerleave', this.onPointerOut);
    this.interactionElement.removeEventListener('touchcancel', this.cancelActiveGesture);
    this.interactionElement.removeEventListener('click', this.onClick, true);
    this.interactionElement.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('blur', this.cancelActiveGesture);
    window.removeEventListener('pagehide', this.cancelActiveGesture);
    document.removeEventListener('visibilitychange', this.cancelActiveGesture);
    this.cancelActiveGesture();

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

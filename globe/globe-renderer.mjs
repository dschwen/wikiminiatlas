import { PlateCarreeGrid, lonLatToUnitSphere } from './plate-carree-grid.mjs';
import {
  distanceAfterWheel,
  rotationDegreesPerPixel,
  selectTileZoom
} from './lod.mjs';
import { lookAt, multiply, perspective } from './mat4.mjs';

const DEG_TO_RAD = Math.PI / 180;
const FIELD_OF_VIEW_RADIANS = 42 * DEG_TO_RAD;
const TARGET_SCREEN_PIXELS_PER_TEXEL = 1.05;

const VERTEX_SHADER = `
  attribute vec2 a_uv;

  uniform mat4 u_viewProjection;
  uniform vec4 u_bounds;

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
    v_uv = a_uv;
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

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return vector.map((component) => component / length);
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

function makePlaceholder(tileSize, x, y, zoom) {
  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;
  const context = canvas.getContext('2d');
  const hue = (x * 37 + y * 61 + zoom * 29) % 360;
  context.fillStyle = `hsl(${hue} 22% 23%)`;
  context.fillRect(0, 0, tileSize, tileSize);
  context.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  context.lineWidth = 2;
  context.strokeRect(1, 1, tileSize - 2, tileSize - 2);
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.font = '12px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(`z${zoom} x${x} y${y}`, tileSize / 2, tileSize / 2 + 4);
  return canvas;
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
    maximumZoom = 15,
    patchSegments = 12,
    initialDistance = 3.1,
    onStateChange = () => {}
  } = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('GlobeRenderer requires a canvas element');
    }
    if (typeof tileUrl !== 'function') {
      throw new TypeError('tileUrl must be a function');
    }
    if (!Number.isInteger(maximumZoom) || maximumZoom < 0 || maximumZoom > 30) {
      throw new RangeError('maximumZoom must be an integer between 0 and 30');
    }

    this.canvas = canvas;
    this.grid = grid;
    this.tileUrl = tileUrl;
    this.maximumZoom = maximumZoom;
    this.onStateChange = onStateChange;
    this.longitude = -112;
    this.latitude = 35;
    this.distance = Number.isFinite(initialDistance)
      ? clamp(initialDistance, 1.0005, 51)
      : 3.1;
    this.textureCache = new Map();
    this.frame = null;
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
    this.mesh = createPatchMesh(gl, patchSegments);
    this.locations = {
      uv: gl.getAttribLocation(this.program, 'a_uv'),
      viewProjection: gl.getUniformLocation(this.program, 'u_viewProjection'),
      bounds: gl.getUniformLocation(this.program, 'u_bounds'),
      texture: gl.getUniformLocation(this.program, 'u_texture')
    };

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

  installControls() {
    let drag = null;

    this.onPointerDown = (event) => {
      drag = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        longitude: this.longitude,
        latitude: this.latitude
      };
      this.canvas.setPointerCapture(event.pointerId);
      this.canvas.classList.add('dragging');
    };

    this.onPointerMove = (event) => {
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      const degreesPerPixel = rotationDegreesPerPixel({
        viewportHeight: Math.max(1, this.canvas.clientHeight),
        distance: this.distance,
        fieldOfViewRadians: FIELD_OF_VIEW_RADIANS
      });
      this.longitude = drag.longitude - (event.clientX - drag.x) * degreesPerPixel;
      this.latitude = clamp(
        drag.latitude + (event.clientY - drag.y) * degreesPerPixel,
        -89,
        89
      );
      this.requestRender();
    };

    this.onPointerUp = (event) => {
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      drag = null;
      this.canvas.releasePointerCapture(event.pointerId);
      this.canvas.classList.remove('dragging');
    };

    this.onWheel = (event) => {
      event.preventDefault();
      this.distance = distanceAfterWheel({
        distance: this.distance,
        deltaY: event.deltaY
      });
      this.requestRender();
    };

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
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

  visibleTiles(zoom, eyeDirection) {
    const horizonAngle = Math.acos(1 / this.distance);
    const tiles = [];
    const aspect = this.canvas.width / this.canvas.height;
    const tangent = Math.tan(FIELD_OF_VIEW_RADIANS / 2);
    const right = normalize(cross([0, 1, 0], eyeDirection));
    const up = cross(eyeDirection, right);
    const eye = eyeDirection.map((component) => component * this.distance);
    const near = Math.max(0.00005, (this.distance - 1) * 0.1);
    const far = this.distance + 1.1;
    const desiredTilePixels = this.grid.tileSize * TARGET_SCREEN_PIXELS_PER_TEXEL;

    const projectedTileSize = (bounds) => {
      const longitudes = [bounds.west, (bounds.west + bounds.east) / 2, bounds.east];
      const latitudes = [bounds.south, (bounds.south + bounds.north) / 2, bounds.north];
      let minimumX = Infinity;
      let maximumX = -Infinity;
      let minimumY = Infinity;
      let maximumY = -Infinity;

      for (const longitude of longitudes) {
        for (const latitude of latitudes) {
          const point = lonLatToUnitSphere(longitude, latitude);
          const relative = [
            point[0] - eye[0],
            point[1] - eye[1],
            point[2] - eye[2]
          ];
          const depth = -dot(relative, eyeDirection);
          if (depth <= 0) {
            continue;
          }
          const screenX = dot(relative, right) / (depth * tangent * aspect) *
            this.canvas.width / 2;
          const screenY = dot(relative, up) / (depth * tangent) *
            this.canvas.height / 2;
          minimumX = Math.min(minimumX, screenX);
          maximumX = Math.max(maximumX, screenX);
          minimumY = Math.min(minimumY, screenY);
          maximumY = Math.max(maximumY, screenY);
        }
      }

      return Math.max(maximumX - minimumX, maximumY - minimumY);
    };

    const visit = (x, y, z) => {
      const bounds = this.grid.tileBounds(x, y, z);
      const center = lonLatToUnitSphere(
        (bounds.west + bounds.east) / 2,
        (bounds.south + bounds.north) / 2
      );
      const angularRadius = Math.min(
        Math.PI,
        this.grid.angularTileSize(z) * DEG_TO_RAD * Math.SQRT2 * 0.55
      );
      const centerAngle = Math.acos(clamp(dot(center, eyeDirection), -1, 1));
      if (centerAngle > horizonAngle + angularRadius) {
        return;
      }

      const boundingRadius = 2 * Math.sin(angularRadius / 2);
      const relative = [
        center[0] - eye[0],
        center[1] - eye[1],
        center[2] - eye[2]
      ];
      const cameraX = dot(relative, right);
      const cameraY = dot(relative, up);
      const depth = -dot(relative, eyeDirection);
      const halfHeight = depth * tangent;
      const halfWidth = halfHeight * aspect;
      if (
        depth + boundingRadius < near ||
        depth - boundingRadius > far ||
        Math.abs(cameraX) > halfWidth + boundingRadius ||
        Math.abs(cameraY) > halfHeight + boundingRadius
      ) {
        return;
      }

      if (z === zoom || projectedTileSize(bounds) <= desiredTilePixels) {
        tiles.push({ x, y, z, bounds });
        return;
      }

      const childX = x * 2;
      const childY = y * 2;
      visit(childX, childY, z + 1);
      visit(childX + 1, childY, z + 1);
      visit(childX, childY + 1, z + 1);
      visit(childX + 1, childY + 1, z + 1);
    };

    const root = this.grid.dimensions(0);
    for (let y = 0; y < root.rows; y += 1) {
      for (let x = 0; x < root.columns; x += 1) {
        visit(x, y, 0);
      }
    }
    return tiles;
  }

  createTexture(tile) {
    const gl = this.gl;
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
      makePlaceholder(this.grid.tileSize, tile.x, tile.y, tile.z)
    );

    const entry = { texture, status: 'loading', url: this.tileUrl(tile) };
    const image = new Image();
    image.decoding = 'async';
    const imageUrl = new URL(entry.url, document.baseURI);
    if (imageUrl.origin !== window.location.origin) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => {
      if (this.destroyed) {
        return;
      }
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        entry.status = 'ready';
      } catch (error) {
        entry.status = 'error';
        entry.error = error;
      }
      this.requestRender();
    };
    image.onerror = () => {
      entry.status = 'error';
      this.requestRender();
    };
    image.src = entry.url;
    entry.image = image;
    return entry;
  }

  textureForTile(tile) {
    const key = this.grid.tileKey(tile.x, tile.y, tile.z);
    if (!this.textureCache.has(key)) {
      this.textureCache.set(key, this.createTexture(tile));
    }
    return this.textureCache.get(key);
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
    const tiles = this.visibleTiles(zoom, eyeDirection);
    const renderedZooms = tiles.map((tile) => tile.z);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.locations.viewProjection, false, viewProjection);
    gl.uniform1i(this.locations.texture, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
    gl.enableVertexAttribArray(this.locations.uv);
    gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);

    let readyCount = 0;
    for (const tile of tiles) {
      const textureEntry = this.textureForTile(tile);
      if (textureEntry.status === 'ready') {
        readyCount += 1;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureEntry.texture);
      gl.uniform4f(
        this.locations.bounds,
        tile.bounds.west * DEG_TO_RAD,
        tile.bounds.south * DEG_TO_RAD,
        tile.bounds.east * DEG_TO_RAD,
        tile.bounds.north * DEG_TO_RAD
      );
      gl.drawElements(gl.TRIANGLES, this.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    this.onStateChange({
      latitude: this.latitude,
      longitude: this.grid.normalizeLongitude(this.longitude),
      distance: this.distance,
      zoom,
      minimumRenderedZoom: Math.min(...renderedZooms),
      maximumRenderedZoom: Math.max(...renderedZooms),
      frontTilePixels: tileZoom.frontTilePixels,
      visibleTiles: tiles.length,
      readyTiles: readyCount
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
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);

    const gl = this.gl;
    for (const entry of this.textureCache.values()) {
      entry.image.src = '';
      gl.deleteTexture(entry.texture);
    }
    gl.deleteBuffer(this.mesh.vertexBuffer);
    gl.deleteBuffer(this.mesh.indexBuffer);
    gl.deleteProgram(this.program);
    this.textureCache.clear();
  }
}

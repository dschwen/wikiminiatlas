import { buildBuildingMesh } from './building-mesh.mjs';

const DEFAULT_MAXIMUM_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAXIMUM_FEATURES = 20000;
const DEFAULT_MAXIMUM_COORDINATES = 500000;

const LAND_POLYGON_RULES = [
  [['natural', 'land_polygons'], { fill: '#fafad0' }]
];

const AREA_POLYGON_RULES = [
  [['natural', ['wetland', 'mud']], { fill: '#c8dae0' }],
  [['natural', ['wood', 'scrub']], { fill: '#96d696' }],
  [['natural', ['beach', 'sand']], { fill: '#faf2af' }],
  [['natural', ['glacier']], { fill: '#e6f5ff', stroke: '#fff' }],
  [['landuse', ['industrial', 'retail', 'commercial', 'residential']], { fill: '#d0d0d0' }],
  [['landuse', ['military', 'railway']], { fill: '#e0c8c8' }],
  [['landuse', ['cemetery', 'recreation_ground', 'grass']], { fill: '#bed6be' }],
  [['leisure', ['park', 'garden', 'meadow', 'village_green', 'golf_course', 'pitch']], { fill: '#c8e0c8' }],
  [['amenity', ['parking']], { fill: '#f0ebc1' }],
  [['aeroway', ['terminal']], { fill: '#bed2be', stroke: '#7f897f' }]
];

const WATER_POLYGON_RULES = [
  [['natural', ['water', 'bay']], { fill: '#9ec7f3', stroke: '#9ec7f3' }],
  [['landuse', 'reservoir'], { fill: '#9ec7f3', stroke: '#9ec7f3' }],
  [['waterway', ['riverbank', 'dock']], { fill: '#9ec7f3', stroke: '#9ec7f3' }],
  [['leisure', 'swimming_pool'], { fill: '#c8c8e0' }]
];

const WATER_LINE_RULES = [
  [['waterway', true], { stroke: '#6b9ed6', width: 1.5 }]
];

const TRANSPORT_LINE_RULES = [
  [['railway', true], { stroke: '#777', width: 1, dash: [3, 2] }],
  [['aeroway', ['runway']], { stroke: '#aaa', width: 3 }],
  [['aeroway', ['taxiway']], { stroke: '#bbb', width: 1.5 }],
  [['highway', ['motorway', 'motorway_link', 'trunk', 'trunk_link']], { stroke: '#d98b72', width: 3 }],
  [['highway', ['primary', 'primary_link']], { stroke: '#e5ad75', width: 2.5 }],
  [['highway', ['secondary', 'secondary_link']], { stroke: '#e8cf87', width: 2 }],
  [['highway', ['tertiary', 'residential', 'unclassified', 'service']], { stroke: '#fff', width: 1.5 }],
  [['highway', ['footway', 'path', 'cycleway', 'track']], { stroke: '#b98d75', width: 1, dash: [2, 2] }],
  [['barrier', true], { stroke: '#777', width: 1 }]
];

export class TileRequestError extends Error {
  constructor(message, { status = null, retryable = true } = {}) {
    super(message);
    this.name = 'TileRequestError';
    this.status = status;
    this.retryable = retryable;
  }
}

function finiteCoordinate(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function countCoordinates(value, budget) {
  if (!Array.isArray(value)) {
    throw new TypeError('geometry coordinates must be arrays');
  }
  if (value.length >= 2 && finiteCoordinate(value[0]) && finiteCoordinate(value[1])) {
    budget.count += 1;
    if (budget.count > budget.maximum) {
      throw new RangeError('JSON tile contains too many coordinates');
    }
    return;
  }
  for (const child of value) {
    countCoordinates(child, budget);
  }
}

function validateGeometry(geometry, coordinateBudget, depth = 0) {
  if (!geometry || typeof geometry !== 'object' || depth > 4) {
    throw new TypeError('invalid JSON tile geometry');
  }
  const supported = new Set([
    'Point', 'MultiPoint', 'LineString', 'MultiLineString',
    'Polygon', 'MultiPolygon', 'GeometryCollection'
  ]);
  if (!supported.has(geometry.type)) {
    throw new TypeError(`unsupported geometry type ${geometry.type}`);
  }
  if (geometry.type === 'GeometryCollection') {
    if (!Array.isArray(geometry.geometries)) {
      throw new TypeError('geometry collection must contain geometries');
    }
    for (const child of geometry.geometries) {
      validateGeometry(child, coordinateBudget, depth + 1);
    }
  } else {
    countCoordinates(geometry.coordinates, coordinateBudget);
  }
}

export function validateJsonTile(payload, requestedTile, {
  maximumFeatures = DEFAULT_MAXIMUM_FEATURES,
  maximumCoordinates = DEFAULT_MAXIMUM_COORDINATES
} = {}) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.data)) {
    throw new TypeError('JSON tile payload must contain a data array');
  }
  if (
    Number(payload.x) !== requestedTile.x ||
    Number(payload.y) !== requestedTile.y ||
    Number(payload.z) !== requestedTile.z
  ) {
    throw new RangeError('JSON tile coordinates do not match the request');
  }
  if (payload.data.length > maximumFeatures) {
    throw new RangeError('JSON tile contains too many features');
  }
  const budget = { count: 0, maximum: maximumCoordinates };
  for (const feature of payload.data) {
    if (!feature || typeof feature !== 'object') {
      throw new TypeError('invalid JSON tile feature');
    }
    feature.tags = feature.tags && typeof feature.tags === 'object' ? feature.tags : {};
    validateGeometry(feature.geo, budget);
  }

  let index = payload.idx;
  if (!index || typeof index !== 'object' || Number(payload.v) < 2) {
    index = {};
    for (let featureIndex = 0; featureIndex < payload.data.length; featureIndex += 1) {
      for (const tag of Object.keys(payload.data[featureIndex].tags)) {
        (index[tag] ||= []).push(featureIndex);
      }
    }
  }
  return {
    x: requestedTile.x,
    y: requestedTile.y,
    z: requestedTile.z,
    version: Number(payload.v) || 1,
    data: payload.data,
    index,
    flags: payload.f && typeof payload.f === 'object' ? payload.f : {},
    coordinateCount: budget.count
  };
}

export function jsonTileUrl(base, { x, y, z }) {
  const url = new URL(base, typeof window === 'undefined' ? 'https://example.test' : window.location.href);
  url.searchParams.set('x', x);
  url.searchParams.set('y', y);
  url.searchParams.set('z', z);
  return base.startsWith('/') && url.origin === 'https://example.test'
    ? `${url.pathname}${url.search}`
    : url.href;
}

function matchingStyle(tags, rules) {
  let style = null;
  for (const [[tag, accepted], candidate] of rules) {
    if (!(tag in tags)) {
      continue;
    }
    if (
      accepted === true ||
      (Array.isArray(accepted)
        ? accepted.includes(tags[tag])
        : accepted === tags[tag])
    ) {
      style = candidate;
    }
  }
  return style;
}

function geometryParts(geometry, wantedType) {
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.flatMap((child) => geometryParts(child, wantedType));
  }
  if (wantedType === 'polygon') {
    if (geometry.type === 'Polygon') return [geometry.coordinates];
    if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  }
  if (wantedType === 'line') {
    if (geometry.type === 'LineString') return [geometry.coordinates];
    if (geometry.type === 'MultiLineString') return geometry.coordinates;
  }
  if (wantedType === 'point') {
    if (geometry.type === 'Point') return [geometry.coordinates];
    if (geometry.type === 'MultiPoint') return geometry.coordinates;
  }
  return [];
}

export function renderJsonTile(tileData, {
  tileSize = 128,
  createCanvas = () => document.createElement('canvas')
} = {}) {
  const canvas = createCanvas();
  canvas.width = tileSize;
  canvas.height = tileSize;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D is unavailable for JSON tiles');
  }
  const span = 60 / 2 ** tileData.z;
  const west = tileData.x * span;
  const north = 90 - tileData.y * span;
  const project = ([longitude, latitude]) => {
    let adjustedLongitude = longitude;
    while (adjustedLongitude - west > 180) adjustedLongitude -= 360;
    while (adjustedLongitude - west < -180) adjustedLongitude += 360;
    return [
      (adjustedLongitude - west) / span * tileSize,
      (north - latitude) / span * tileSize
    ];
  };
  const lineWidthMultiplier = 1.25 ** (tileData.z - 13);

  context.fillStyle = '#9ec7f3';
  context.fillRect(0, 0, tileSize, tileSize);

  const traceLine = (coordinates, close = false) => {
    for (let index = 0; index < coordinates.length; index += 1) {
      const [x, y] = project(coordinates[index]);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    if (close) context.closePath();
  };

  const drawPolygons = (rules) => {
    for (const feature of tileData.data) {
      // Buildings are an independent 3D resource. Keeping their footprints out
      // of the canvas avoids duplicating them and lets the surface imagery below
      // remain visible through translucent building geometry.
      if ('building' in feature.tags || 'building:part' in feature.tags) continue;
      const style = matchingStyle(feature.tags, rules);
      if (!style) continue;
      for (const polygon of geometryParts(feature.geo, 'polygon')) {
        context.beginPath();
        for (const ring of polygon) traceLine(ring, true);
        if (style.fill) {
          context.fillStyle = style.fill;
          context.fill('evenodd');
        }
        if (style.stroke) {
          context.strokeStyle = style.stroke;
          context.lineWidth = lineWidthMultiplier;
          context.stroke();
        }
      }
    }
  };

  const drawLines = (rules) => {
    for (const feature of tileData.data) {
      const style = matchingStyle(feature.tags, rules);
      if (!style) continue;
      const lines = geometryParts(feature.geo, 'line');
      if (lines.length === 0) continue;
      context.beginPath();
      for (const line of lines) traceLine(line);
      context.strokeStyle = style.stroke;
      context.lineWidth = style.width * lineWidthMultiplier;
      context.setLineDash(style.dash || []);
      context.stroke();
      context.setLineDash([]);
    }
  };

  // Keep the cartographic stack independent of arbitrary server feature order.
  drawPolygons(LAND_POLYGON_RULES);
  drawPolygons(AREA_POLYGON_RULES);
  drawPolygons(WATER_POLYGON_RULES);
  drawLines(WATER_LINE_RULES);
  drawLines(TRANSPORT_LINE_RULES);
  return canvas;
}

export function createJsonTileProducer({
  endpoint = '../tiles/jsontile.php',
  fetchImpl = (...args) => fetch(...args),
  tileSize = 128,
  createCanvas,
  buildingFromZoom = 14,
  maximumBuildingTriangles = 1600,
  maximumResponseBytes = DEFAULT_MAXIMUM_RESPONSE_BYTES
} = {}) {
  return async (tile, url, signal) => {
    const requestUrl = url || jsonTileUrl(endpoint, tile);
    const response = await fetchImpl(requestUrl, {
      signal,
      credentials: 'same-origin'
    });
    if (!response.ok) {
      const status = Number(response.status);
      const retryable = !Number.isFinite(status) ||
        status === 408 || status === 429 || status >= 500;
      throw new TileRequestError(`JSON tile request failed with HTTP ${response.status}`, {
        status: Number.isFinite(status) ? status : null,
        retryable
      });
    }
    const declaredLength = Number(response.headers && response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maximumResponseBytes) {
      throw new RangeError('JSON tile response is too large');
    }
    const text = await response.text();
    if (text.length > maximumResponseBytes) {
      throw new RangeError('JSON tile response is too large');
    }
    const data = validateJsonTile(JSON.parse(text), tile);
    const source = renderJsonTile(data, { tileSize, createCanvas });
    return tile.z >= buildingFromZoom
      ? {
          source,
          auxiliary: buildBuildingMesh(data, {
            maximumTriangles: maximumBuildingTriangles
          })
        }
      : source;
  };
}

export function loadImageTile(url, signal, {
  createImage = () => new Image()
} = {}) {
  return new Promise((resolve, reject) => {
    const image = createImage();
    if ('decoding' in image) image.decoding = 'async';
    if ('crossOrigin' in image) image.crossOrigin = 'anonymous';
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      try { image.src = ''; } catch (error) {}
      reject(new DOMException('Tile load aborted', 'AbortError'));
    };
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load raster tile ${url}`));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else image.src = url;
  });
}

export function createHybridJsonTileProducer({
  jsonFromZoom = 13,
  createImage,
  ...jsonOptions
} = {}) {
  const produceJson = createJsonTileProducer(jsonOptions);
  return (tile, url, signal) => tile.z >= jsonFromZoom
    ? produceJson(tile, url, signal)
    : loadImageTile(url, signal, { createImage });
}

import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

const WEB_MERCATOR_HALF_WORLD = 20037508.34;
const DEFAULT_MAXIMUM_COORDINATES = 250000;

function finiteNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${name} must be finite`);
  }
  return number;
}

function clampLatitude(latitude) {
  return Math.max(-90, Math.min(90, latitude));
}

function sameCoordinate(first, second) {
  return Math.abs(first.longitude - second.longitude) < 1e-12 &&
    Math.abs(first.latitude - second.latitude) < 1e-12;
}

function cleanPath(coordinates, convert, budget, minimumLength) {
  if (!Array.isArray(coordinates)) {
    throw new TypeError('overlay coordinates must be arrays');
  }
  const path = [];
  for (const coordinate of coordinates) {
    budget.count += 1;
    if (budget.count > budget.maximum) {
      throw new RangeError('overlay contains too many coordinates');
    }
    const point = convert(coordinate);
    if (path.length === 0 || !sameCoordinate(path[path.length - 1], point)) {
      path.push(point);
    }
  }
  if (path.length > 1 && sameCoordinate(path[0], path[path.length - 1])) {
    path.pop();
  }
  if (path.length < minimumLength) {
    return null;
  }

  for (let index = 1; index < path.length; index += 1) {
    while (path[index].longitude - path[index - 1].longitude > 180) {
      path[index].longitude -= 360;
    }
    while (path[index].longitude - path[index - 1].longitude < -180) {
      path[index].longitude += 360;
    }
  }
  return path;
}

function minimalLongitudeBounds(longitudes) {
  const normalized = longitudes
    .map((longitude) => ((longitude % 360) + 360) % 360)
    .sort((first, second) => first - second);
  if (normalized.length === 1) {
    return { west: normalized[0], east: normalized[0] };
  }

  let largestGap = -Infinity;
  let westIndex = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const next = index + 1 < normalized.length
      ? normalized[index + 1]
      : normalized[0] + 360;
    const gap = next - normalized[index];
    if (gap > largestGap) {
      largestGap = gap;
      westIndex = (index + 1) % normalized.length;
    }
  }

  const west = normalized[westIndex];
  let east = normalized[(westIndex - 1 + normalized.length) % normalized.length];
  if (east < west) east += 360;
  return { west, east };
}

function finalizeOverlay(lines, polygons) {
  const points = [];
  for (const line of lines) points.push(...line);
  for (const polygon of polygons) {
    for (const ring of polygon.outer) points.push(...ring);
    for (const ring of polygon.holes) points.push(...ring);
  }
  if (points.length === 0) {
    return {
      lines: [],
      polygons: [],
      coordinateCount: 0,
      bounds: null,
      view: null
    };
  }

  const longitudeBounds = minimalLongitudeBounds(points.map((point) => point.longitude));
  let south = Infinity;
  let north = -Infinity;
  for (const point of points) {
    south = Math.min(south, point.latitude);
    north = Math.max(north, point.latitude);
  }
  const longitude = (longitudeBounds.west + longitudeBounds.east) / 2;
  const latitude = (south + north) / 2;
  const center = lonLatToUnitSphere(longitude, latitude);
  let angularRadius = 0;
  for (const point of points) {
    const unit = lonLatToUnitSphere(point.longitude, point.latitude);
    const cosine = Math.max(-1, Math.min(1,
      unit[0] * center[0] + unit[1] * center[1] + unit[2] * center[2]
    ));
    angularRadius = Math.max(angularRadius, Math.acos(cosine));
  }

  return {
    lines,
    polygons,
    coordinateCount: points.length,
    bounds: {
      west: longitudeBounds.west,
      east: longitudeBounds.east,
      south,
      north
    },
    view: { longitude, latitude, angularRadius }
  };
}

function mercatorCoordinate(coordinate) {
  if (!Array.isArray(coordinate) || coordinate.length < 2) {
    throw new TypeError('GeoJSON coordinates must contain x and y');
  }
  const x = finiteNumber(coordinate[0], 'Web Mercator x');
  const y = finiteNumber(coordinate[1], 'Web Mercator y');
  if (Math.abs(x) > WEB_MERCATOR_HALF_WORLD * 1.01 ||
      Math.abs(y) > WEB_MERCATOR_HALF_WORLD * 1.01) {
    throw new RangeError('GeoJSON coordinate is outside Web Mercator bounds');
  }
  const longitude = x / WEB_MERCATOR_HALF_WORLD * 180;
  const latitude = 180 / Math.PI * (
    2 * Math.atan(Math.exp(y / WEB_MERCATOR_HALF_WORLD * Math.PI)) - Math.PI / 2
  );
  return { longitude, latitude: clampLatitude(latitude) };
}

function legacyCoordinate(coordinate) {
  if (!coordinate || typeof coordinate !== 'object') {
    throw new TypeError('legacy overlay coordinates must be objects');
  }
  return {
    longitude: finiteNumber(coordinate.lon, 'longitude'),
    latitude: clampLatitude(finiteNumber(coordinate.lat, 'latitude'))
  };
}

export function normalizeWiwosmGeoJson(input, {
  maximumCoordinates = DEFAULT_MAXIMUM_COORDINATES
} = {}) {
  const lines = [];
  const polygons = [];
  const budget = { count: 0, maximum: maximumCoordinates };

  const addLine = (coordinates) => {
    const path = cleanPath(coordinates, mercatorCoordinate, budget, 2);
    if (path) lines.push(path);
  };
  const addPolygon = (rings) => {
    if (!Array.isArray(rings) || rings.length === 0) return;
    const outer = cleanPath(rings[0], mercatorCoordinate, budget, 3);
    const holes = rings.slice(1)
      .map((ring) => cleanPath(ring, mercatorCoordinate, budget, 3))
      .filter(Boolean);
    if (outer) polygons.push({ outer: [outer], holes });
  };

  const visit = (geometry, depth = 0) => {
    if (!geometry || typeof geometry !== 'object' || depth > 6) {
      throw new TypeError('invalid WIWOSM geometry');
    }
    if (geometry.type === 'Feature') {
      visit(geometry.geometry, depth + 1);
      return;
    }
    if (geometry.type === 'FeatureCollection') {
      if (!Array.isArray(geometry.features)) throw new TypeError('invalid FeatureCollection');
      for (const feature of geometry.features) visit(feature, depth + 1);
      return;
    }
    if (geometry.type === 'GeometryCollection') {
      if (!Array.isArray(geometry.geometries)) throw new TypeError('invalid GeometryCollection');
      for (const child of geometry.geometries) visit(child, depth + 1);
      return;
    }
    switch (geometry.type) {
      case 'LineString':
        addLine(geometry.coordinates);
        break;
      case 'MultiLineString':
        if (!Array.isArray(geometry.coordinates)) throw new TypeError('invalid MultiLineString');
        for (const line of geometry.coordinates) addLine(line);
        break;
      case 'Polygon':
        addPolygon(geometry.coordinates);
        break;
      case 'MultiPolygon':
        if (!Array.isArray(geometry.coordinates)) throw new TypeError('invalid MultiPolygon');
        for (const polygon of geometry.coordinates) addPolygon(polygon);
        break;
      case 'Point':
        cleanPath([geometry.coordinates], mercatorCoordinate, budget, 2);
        break;
      case 'MultiPoint':
        cleanPath(geometry.coordinates, mercatorCoordinate, budget, Number.MAX_SAFE_INTEGER);
        break;
      default:
        throw new TypeError(`unsupported WIWOSM geometry type ${geometry.type}`);
    }
  };

  visit(input);
  return finalizeOverlay(lines, polygons);
}

export function normalizeLegacyKmlOverlay(input, {
  maximumCoordinates = DEFAULT_MAXIMUM_COORDINATES
} = {}) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('legacy KML overlay must be an object');
  }
  const lines = [];
  const polygons = [];
  const budget = { count: 0, maximum: maximumCoordinates };

  if (input.ways !== undefined && !Array.isArray(input.ways)) {
    throw new TypeError('legacy KML ways must be an array');
  }
  for (const way of input.ways || []) {
    const path = cleanPath(way, legacyCoordinate, budget, 2);
    if (path) lines.push(path);
  }

  if (input.areas !== undefined && !Array.isArray(input.areas)) {
    throw new TypeError('legacy KML areas must be an array');
  }
  for (const area of input.areas || []) {
    if (!area || typeof area !== 'object' || !Array.isArray(area.outer)) {
      throw new TypeError('legacy KML area must contain outer rings');
    }
    const outer = area.outer
      .map((ring) => cleanPath(ring, legacyCoordinate, budget, 3))
      .filter(Boolean);
    const holes = (area.inner || [])
      .map((ring) => cleanPath(ring, legacyCoordinate, budget, 3))
      .filter(Boolean);
    if (outer.length > 0) polygons.push({ outer, holes });
  }

  return finalizeOverlay(lines, polygons);
}

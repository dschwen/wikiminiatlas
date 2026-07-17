import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const COMMONS_THUMBNAIL_WIDTHS = Object.freeze([
  120, 150, 180, 200, 220, 250, 300, 400
]);

function commonsThumbnailRequestWidth(width) {
  return COMMONS_THUMBNAIL_WIDTHS.find((preset) => width < preset) || width;
}

export function commonsThumbnailUrl(filename, width, hashPrefix = '') {
  const requestedWidth = commonsThumbnailRequestWidth(Math.max(1, Math.ceil(width)));
  const encodedFilename = String(filename);
  const prefix = String(hashPrefix);
  if (prefix.length >= 2) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/' +
      `${prefix[0]}/${prefix}/${encodedFilename}/${requestedWidth}px-${encodedFilename}`;
  }
  return 'https://commons.wikimedia.org/w/thumb.php?' + new URLSearchParams({
    w: String(requestedWidth),
    f: encodedFilename
  });
}

export function commonsFileUrl(filename) {
  return `https://commons.wikimedia.org/wiki/File:${String(filename)}`;
}

function commonsThumbnail(item) {
  if (!item.img) return null;
  const intrinsicWidth = Math.max(1, finiteNumber(item.w, 1));
  const intrinsicHeight = Math.max(1, finiteNumber(item.h, 1));
  const maximumSide = finiteNumber(item.style) === -2 ? 24 : 48;
  const width = intrinsicWidth > intrinsicHeight
    ? maximumSide
    : Math.floor(maximumSide * intrinsicWidth / intrinsicHeight);
  const height = Math.max(1, Math.floor(width / intrinsicWidth * intrinsicHeight));
  return {
    filename: String(item.img),
    width: Math.max(1, width),
    height,
    url: commonsThumbnailUrl(item.img, maximumSide, item.m5),
    fileUrl: commonsFileUrl(item.img)
  };
}

export function legacyLabelBatchUrl(labelBase, {
  grid,
  tiles,
  language = 'en',
  globe = 'earth'
}) {
  if (!Array.isArray(tiles) || tiles.length === 0 || tiles.length > 10) {
    throw new RangeError('a label batch must contain between one and ten tiles');
  }
  const zoom = tiles[0].z;
  if (tiles.some((tile) => tile.z !== zoom)) {
    throw new RangeError('all tiles in a label batch must use the same zoom');
  }

  const range = tiles.map((tile) => {
    const x = grid.normalizeTileX(tile.x, zoom);
    return `${x},${grid.labelServiceY(tile.y, zoom)}`;
  }).join('|');
  const parameters = new URLSearchParams({
    l: language,
    a: '0',
    b: '0',
    z: String(zoom),
    g: globe,
    r: range
  });
  const separator = labelBase.includes('?') ? '&' : '?';
  return `${labelBase}${separator}${parameters}`;
}

export function legacyLabelCoordinates(item, zoom, grid) {
  const span = grid.angularTileSize(zoom);
  const serviceY = finiteNumber(item.dy);
  const north = -90 + (serviceY + 1) * span;
  return {
    longitude: grid.seamLongitude + finiteNumber(item.dx) * span +
      (finiteNumber(item.tx) + finiteNumber(item.fx)) / grid.tileSize * span,
    latitude: north -
      (finiteNumber(item.ty) + finiteNumber(item.fy)) / grid.tileSize * span
  };
}

export function normalizeLabel(item, zoom, grid, defaultLanguage = 'en') {
  const legacyCoordinates = legacyLabelCoordinates(item, zoom, grid);
  const latitude = Number.isFinite(Number(item.lat))
    ? Number(item.lat)
    : legacyCoordinates.latitude;
  const longitude = Number.isFinite(Number(item.lon))
    ? Number(item.lon)
    : legacyCoordinates.longitude;
  const language = item.lang || defaultLanguage;
  const thumbnail = language === 'commons' ? commonsThumbnail(item) : null;
  const name = String(item.name || item.page || item.img || '');
  const page = item.page ? String(item.page) : (thumbnail ? thumbnail.filename : '');
  const stableId = item.id || [
    language,
    page || name,
    latitude.toFixed(6),
    longitude.toFixed(6)
  ].join(':');

  return {
    id: String(stableId),
    name,
    page,
    language,
    latitude,
    longitude: grid.normalizeLongitude(longitude),
    style: Math.max(0, Math.min(10, Math.trunc(finiteNumber(item.style)))),
    weight: Math.trunc(finiteNumber(item.wg)),
    thumbnail,
    source: item
  };
}

export function projectGeographicPoint({
  longitude,
  latitude,
  eyeDirection,
  distance,
  viewProjection,
  viewportWidth,
  viewportHeight
}) {
  const point = lonLatToUnitSphere(longitude, latitude);
  const horizon = 1 / distance;
  const facing = point[0] * eyeDirection[0] +
    point[1] * eyeDirection[1] +
    point[2] * eyeDirection[2];
  if (facing <= horizon) {
    return null;
  }

  const clipX = viewProjection[0] * point[0] +
    viewProjection[4] * point[1] +
    viewProjection[8] * point[2] + viewProjection[12];
  const clipY = viewProjection[1] * point[0] +
    viewProjection[5] * point[1] +
    viewProjection[9] * point[2] + viewProjection[13];
  const clipZ = viewProjection[2] * point[0] +
    viewProjection[6] * point[1] +
    viewProjection[10] * point[2] + viewProjection[14];
  const clipW = viewProjection[3] * point[0] +
    viewProjection[7] * point[1] +
    viewProjection[11] * point[2] + viewProjection[15];
  if (clipW <= 0) {
    return null;
  }

  const ndcX = clipX / clipW;
  const ndcY = clipY / clipW;
  const ndcZ = clipZ / clipW;
  if (Math.abs(ndcX) > 1 || Math.abs(ndcY) > 1 || ndcZ < -1 || ndcZ > 1) {
    return null;
  }

  return {
    x: (ndcX * 0.5 + 0.5) * viewportWidth,
    y: (0.5 - ndcY * 0.5) * viewportHeight,
    depth: ndcZ,
    facing
  };
}

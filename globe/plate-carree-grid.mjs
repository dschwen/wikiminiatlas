const FULL_CIRCLE = 360;
const HALF_CIRCLE = 180;

function assertFinite(value, name) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function assertZoom(zoom) {
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 30) {
    throw new RangeError('zoom must be an integer between 0 and 30');
  }
}

/**
 * The geographic tile grid used by the legacy WikiMiniAtlas services.
 *
 * Zoom zero contains six columns and three rows. Rows are north-to-south in
 * browser/rendering coordinates. The label service stores the same rows in
 * the opposite direction; labelServiceY() performs that conversion.
 */
export class PlateCarreeGrid {
  constructor({
    tileSize = 128,
    baseColumns = 6,
    baseRows = 3,
    seamLongitude = 0
  } = {}) {
    if (!Number.isInteger(tileSize) || tileSize <= 0) {
      throw new RangeError('tileSize must be a positive integer');
    }
    if (!Number.isInteger(baseColumns) || baseColumns <= 0) {
      throw new RangeError('baseColumns must be a positive integer');
    }
    if (!Number.isInteger(baseRows) || baseRows <= 0) {
      throw new RangeError('baseRows must be a positive integer');
    }
    assertFinite(seamLongitude, 'seamLongitude');

    if (baseColumns !== baseRows * 2) {
      throw new RangeError('a global plate carrée grid must be twice as wide as it is high');
    }

    this.tileSize = tileSize;
    this.baseColumns = baseColumns;
    this.baseRows = baseRows;
    this.seamLongitude = seamLongitude;
  }

  dimensions(zoom) {
    assertZoom(zoom);
    const scale = 2 ** zoom;
    return {
      columns: this.baseColumns * scale,
      rows: this.baseRows * scale
    };
  }

  angularTileSize(zoom) {
    const { columns } = this.dimensions(zoom);
    return FULL_CIRCLE / columns;
  }

  normalizeLongitude(longitude) {
    assertFinite(longitude, 'longitude');
    const offset = longitude - this.seamLongitude;
    return this.seamLongitude + ((offset % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
  }

  clampLatitude(latitude) {
    assertFinite(latitude, 'latitude');
    return Math.max(-90, Math.min(90, latitude));
  }

  normalizeTileX(x, zoom) {
    assertZoom(zoom);
    if (!Number.isInteger(x)) {
      throw new TypeError('tile x must be an integer');
    }
    const { columns } = this.dimensions(zoom);
    return ((x % columns) + columns) % columns;
  }

  validateTileY(y, zoom) {
    assertZoom(zoom);
    if (!Number.isInteger(y)) {
      throw new TypeError('tile y must be an integer');
    }
    const { rows } = this.dimensions(zoom);
    if (y < 0 || y >= rows) {
      throw new RangeError(`tile y must be between 0 and ${rows - 1}`);
    }
    return y;
  }

  tileForLonLat(longitude, latitude, zoom) {
    const { columns, rows } = this.dimensions(zoom);
    const span = FULL_CIRCLE / columns;
    const lon = this.normalizeLongitude(longitude);
    const lat = this.clampLatitude(latitude);

    const x = Math.min(columns - 1, Math.floor((lon - this.seamLongitude) / span));
    const y = Math.min(rows - 1, Math.floor((90 - lat) / span));
    return { x, y, z: zoom };
  }

  tileBounds(x, y, zoom) {
    x = this.normalizeTileX(x, zoom);
    y = this.validateTileY(y, zoom);
    const span = this.angularTileSize(zoom);
    const west = this.seamLongitude + x * span;
    const north = 90 - y * span;

    return {
      west,
      south: north - span,
      east: west + span,
      north
    };
  }

  lonLatToTilePixel(longitude, latitude, zoom) {
    const tile = this.tileForLonLat(longitude, latitude, zoom);
    const bounds = this.tileBounds(tile.x, tile.y, zoom);
    const lon = this.normalizeLongitude(longitude);
    const lat = this.clampLatitude(latitude);
    const span = bounds.east - bounds.west;

    return {
      ...tile,
      pixelX: ((lon - bounds.west) / span) * this.tileSize,
      pixelY: ((bounds.north - lat) / span) * this.tileSize
    };
  }

  tilePixelToLonLat(x, y, zoom, pixelX, pixelY) {
    assertFinite(pixelX, 'pixelX');
    assertFinite(pixelY, 'pixelY');
    const bounds = this.tileBounds(x, y, zoom);
    const span = bounds.east - bounds.west;

    return {
      longitude: bounds.west + (pixelX / this.tileSize) * span,
      latitude: bounds.north - (pixelY / this.tileSize) * span
    };
  }

  labelServiceY(renderY, zoom) {
    renderY = this.validateTileY(renderY, zoom);
    const { rows } = this.dimensions(zoom);
    return rows - renderY - 1;
  }

  renderYFromLabelService(serviceY, zoom) {
    return this.labelServiceY(serviceY, zoom);
  }

  tileKey(x, y, zoom) {
    x = this.normalizeTileX(x, zoom);
    y = this.validateTileY(y, zoom);
    return `${zoom}/${x}/${y}`;
  }
}

export function lonLatToUnitSphere(longitude, latitude) {
  assertFinite(longitude, 'longitude');
  assertFinite(latitude, 'latitude');
  const lon = longitude * Math.PI / HALF_CIRCLE;
  const lat = latitude * Math.PI / HALF_CIRCLE;
  const cosLat = Math.cos(lat);

  return [
    cosLat * Math.cos(lon),
    Math.sin(lat),
    -cosLat * Math.sin(lon)
  ];
}

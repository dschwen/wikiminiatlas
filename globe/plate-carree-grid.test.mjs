import test from 'node:test';
import assert from 'node:assert/strict';

import { PlateCarreeGrid, lonLatToUnitSphere } from './plate-carree-grid.mjs';
import { legacyRasterTileUrl } from './globe-renderer.mjs';

const grid = new PlateCarreeGrid();

test('matches the WikiMiniAtlas six-by-three zoom-zero grid', () => {
  assert.deepEqual(grid.dimensions(0), { columns: 6, rows: 3 });
  assert.deepEqual(grid.dimensions(4), { columns: 96, rows: 48 });
  assert.equal(grid.angularTileSize(0), 60);
  assert.equal(grid.angularTileSize(4), 3.75);
});

test('wraps longitude at the legacy zero-degree seam', () => {
  assert.equal(grid.normalizeLongitude(-1), 359);
  assert.equal(grid.normalizeLongitude(360), 0);
  assert.deepEqual(grid.tileForLonLat(1, 89, 0), { x: 0, y: 0, z: 0 });
  assert.deepEqual(grid.tileForLonLat(-1, 89, 0), { x: 5, y: 0, z: 0 });
});

test('uses north-to-south rendering rows and handles both poles', () => {
  assert.deepEqual(grid.tileForLonLat(0, 90, 0), { x: 0, y: 0, z: 0 });
  assert.deepEqual(grid.tileForLonLat(0, -90, 0), { x: 0, y: 2, z: 0 });
  assert.deepEqual(grid.tileBounds(0, 0, 0), {
    west: 0,
    south: 30,
    east: 60,
    north: 90
  });
});

test('converts between rendering and label-service row orientation', () => {
  assert.equal(grid.labelServiceY(0, 0), 2);
  assert.equal(grid.labelServiceY(1, 0), 1);
  assert.equal(grid.labelServiceY(2, 0), 0);
  assert.equal(grid.renderYFromLabelService(2, 0), 0);
});

test('round-trips geographic coordinates through tile-local pixels', () => {
  const source = { longitude: -112.043, latitude: 43.615 };
  const pixel = grid.lonLatToTilePixel(source.longitude, source.latitude, 7);
  const result = grid.tilePixelToLonLat(
    pixel.x,
    pixel.y,
    pixel.z,
    pixel.pixelX,
    pixel.pixelY
  );

  assert.ok(Math.abs(grid.normalizeLongitude(source.longitude) - result.longitude) < 1e-10);
  assert.ok(Math.abs(source.latitude - result.latitude) < 1e-10);
});

test('normalizes wrapped tile columns in bounds and keys', () => {
  assert.deepEqual(grid.tileBounds(-1, 0, 0), grid.tileBounds(5, 0, 0));
  assert.equal(grid.tileKey(-1, 0, 0), '0/5/0');
});

test('maps cardinal geographic positions to a unit sphere', () => {
  const primeMeridian = lonLatToUnitSphere(0, 0);
  assert.equal(primeMeridian[0], 1);
  assert.equal(primeMeridian[1], 0);
  assert.equal(Math.abs(primeMeridian[2]), 0);

  const north = lonLatToUnitSphere(123, 90);
  assert.ok(Math.abs(north[0]) < 1e-15);
  assert.equal(north[1], 1);
  assert.ok(Math.abs(north[2]) < 1e-15);

  const east = lonLatToUnitSphere(90, 0);
  assert.ok(Math.abs(east[0]) < 1e-15);
  assert.equal(east[1], 0);
  assert.equal(east[2], -1);
});

test('rejects invalid zoom and row inputs', () => {
  assert.throws(() => grid.dimensions(-1), RangeError);
  assert.throws(() => grid.tileBounds(0, 3, 0), RangeError);
  assert.throws(() => grid.tileForLonLat(Number.NaN, 0, 0), TypeError);
});

test('retains the legacy raster URL layout on both sides of zoom seven', () => {
  assert.equal(
    legacyRasterTileUrl('/tiles/', { x: 4, y: 2, z: 6 }),
    '/tiles/mapnik/6/tile_2_4.png'
  );
  assert.equal(
    legacyRasterTileUrl('/tiles/', { x: 130, y: 75, z: 7 }),
    '/tiles/mapnik/7/75/tile_75_130.png'
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  distanceAfterWheel,
  rotationDegreesPerPixel,
  selectTileZoom
} from './lod.mjs';

const baseLod = {
  viewportHeight: 800,
  fieldOfViewRadians: 42 * Math.PI / 180,
  baseTileDegrees: 60,
  tileSize: 128,
  maximumZoom: 15,
  targetScreenPixelsPerTexel: 1.05
};

test('selects detail from front-surface pixel density', () => {
  const result = selectTileZoom({ ...baseLod, distance: 3.1 });
  assert.equal(result.zoom, 2);
  assert.ok(result.frontTilePixels <= 128 * 1.05);
  assert.ok(result.frontTilePixels > 128 * 1.05 / 2);
});

test('increases tile zoom monotonically as the camera approaches', () => {
  const distances = [20, 6, 3, 1.5, 1.1, 1.01, 1.001];
  const zooms = distances.map((distance) =>
    selectTileZoom({ ...baseLod, distance }).zoom
  );
  assert.deepEqual(zooms, [...zooms].sort((a, b) => a - b));
  assert.ok(zooms.at(-1) >= 12);
});

test('accounts for physical display pixels when choosing tile detail', () => {
  const standard = selectTileZoom({ ...baseLod, distance: 3.1 });
  const highDensity = selectTileZoom({
    ...baseLod,
    viewportHeight: baseLod.viewportHeight * 2,
    distance: 3.1
  });
  assert.equal(highDensity.zoom, standard.zoom + 1);
});

test('honors the configured maximum tile zoom', () => {
  const result = selectTileZoom({
    ...baseLod,
    distance: 1.00001,
    maximumZoom: 8
  });
  assert.equal(result.zoom, 8);
});

test('reduces rotation sensitivity in proportion to close-up altitude', () => {
  const far = rotationDegreesPerPixel({
    viewportHeight: 800,
    distance: 3,
    fieldOfViewRadians: baseLod.fieldOfViewRadians
  });
  const close = rotationDegreesPerPixel({
    viewportHeight: 800,
    distance: 1.01,
    fieldOfViewRadians: baseLod.fieldOfViewRadians
  });
  assert.ok(close < far / 100);
  assert.ok(close > 0);
});

test('zooms exponentially by altitude and supports a wide range', () => {
  const closer = distanceAfterWheel({ distance: 1.01, deltaY: -100 });
  const farther = distanceAfterWheel({ distance: 1.01, deltaY: 100 });
  assert.ok(closer > 1 && closer < 1.01);
  assert.ok(farther > 1.01);

  assert.equal(
    distanceAfterWheel({ distance: 1.0005, deltaY: -1000 }),
    1.0005
  );
  assert.equal(
    distanceAfterWheel({ distance: 51, deltaY: 1000 }),
    51
  );
});

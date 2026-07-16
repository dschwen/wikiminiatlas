import test from 'node:test';
import assert from 'node:assert/strict';

import {
  centerSurfaceRadiansPerPixel,
  distanceAfterPinch,
  distanceAfterZoomSteps,
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

test('reports center surface resolution in CSS pixels', () => {
  const resolution = centerSurfaceRadiansPerPixel({
    viewportHeight: 800,
    distance: 3,
    fieldOfViewRadians: baseLod.fieldOfViewRadians
  });
  assert.ok(Math.abs(
    resolution - 4 * Math.tan(baseLod.fieldOfViewRadians / 2) / 800
  ) < 1e-15);
  assert.equal(centerSurfaceRadiansPerPixel({
    viewportHeight: 1600,
    distance: 3,
    fieldOfViewRadians: baseLod.fieldOfViewRadians
  }), resolution / 2);
});

test('button zoom steps halve or double altitude', () => {
  assert.equal(distanceAfterZoomSteps({ distance: 3, steps: 1 }), 2);
  assert.equal(distanceAfterZoomSteps({ distance: 3, steps: -1 }), 5);
  assert.equal(distanceAfterZoomSteps({ distance: 1.0005, steps: 1 }), 1.0005);
  assert.equal(distanceAfterZoomSteps({ distance: 51, steps: -1 }), 51);
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

test('pinching apart zooms in and pinching together zooms out', () => {
  assert.ok(Math.abs(distanceAfterPinch({
    distance: 1.1,
    startSpan: 100,
    currentSpan: 200
  }) - 1.05) < 1e-12);

  assert.ok(Math.abs(distanceAfterPinch({
    distance: 1.1,
    startSpan: 100,
    currentSpan: 50
  }) - 1.2) < 1e-12);
});

test('pinch zoom honors camera limits and rejects zero-length spans', () => {
  assert.equal(distanceAfterPinch({
    distance: 1.001,
    startSpan: 1,
    currentSpan: 10000
  }), 1.0005);
  assert.equal(distanceAfterPinch({
    distance: 2,
    startSpan: 10000,
    currentSpan: 1
  }), 51);
  assert.throws(() => distanceAfterPinch({
    distance: 2,
    startSpan: 0,
    currentSpan: 1
  }), RangeError);
});

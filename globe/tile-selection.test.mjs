import test from 'node:test';
import assert from 'node:assert/strict';

import { PlateCarreeGrid, lonLatToUnitSphere } from './plate-carree-grid.mjs';
import { selectVisibleTiles } from './tile-selection.mjs';

const grid = new PlateCarreeGrid();
const baseOptions = {
  grid,
  maximumZoom: 15,
  eyeDirection: lonLatToUnitSphere(-112, 35),
  distance: 3.1,
  viewportWidth: 1200,
  viewportHeight: 800,
  fieldOfViewRadians: 42 * Math.PI / 180,
  desiredTilePixels: 128 * 1.05
};

test('enforces a hard visible-leaf budget', () => {
  const selection = selectVisibleTiles({
    ...baseOptions,
    distance: 1.001,
    maximumLeafTiles: 32
  });
  assert.ok(selection.tiles.length <= 32);
  assert.equal(selection.budgetLimited, true);
});

test('uses additional budget to refine the visible surface', () => {
  const small = selectVisibleTiles({ ...baseOptions, maximumLeafTiles: 64 });
  const large = selectVisibleTiles({ ...baseOptions, maximumLeafTiles: 256 });
  assert.ok(large.tiles.length > small.tiles.length);
  assert.ok(large.maximumZoom >= small.maximumZoom);
});

test('does not enumerate the theoretical high-zoom globe', () => {
  const selection = selectVisibleTiles({
    ...baseOptions,
    distance: 1.0005,
    maximumLeafTiles: 256
  });
  assert.ok(selection.tiles.length <= 256);
  assert.ok(selection.visitedNodes < 5000);
  assert.ok(selection.maximumZoom >= 10);
});

test('rejects a leaf budget smaller than the zoom-zero grid', () => {
  assert.throws(() => selectVisibleTiles({
    ...baseOptions,
    maximumLeafTiles: 17
  }), RangeError);
});

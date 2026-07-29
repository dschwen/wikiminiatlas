import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildingResources,
  distanceForAngularRadius,
  lostPointerCaptureEndsGesture,
  normalizeLightDirection,
  parentPrefetchDemandFor,
  pointerIsOutsideInteraction,
  pointerNeedsViewportCapture,
  transitionChildrenFor,
  tileDemandsFor
} from './globe-renderer.mjs';
import { PlateCarreeGrid } from './plate-carree-grid.mjs';

test('normalizes and validates world-space light directions', () => {
  assert.deepEqual(normalizeLightDirection([0, 3, 4]), [0, 0.6, 0.8]);
  assert.throws(() => normalizeLightDirection([0, 0, 0]), /cannot be zero/);
  assert.throws(() => normalizeLightDirection([1, 2]), /three finite/);
});

test('fits a spherical angular radius inside the limiting viewport dimension', () => {
  const small = distanceForAngularRadius({
    angularRadius: 1 * Math.PI / 180,
    viewportWidth: 800,
    viewportHeight: 600
  });
  const large = distanceForAngularRadius({
    angularRadius: 20 * Math.PI / 180,
    viewportWidth: 800,
    viewportHeight: 600
  });
  assert.ok(small > 1);
  assert.ok(large > small);
});

test('detects touch pointers that leave an embedded interaction viewport', () => {
  const element = {
    getBoundingClientRect: () => ({
      left: 10, top: 20, right: 210, bottom: 120
    })
  };
  assert.equal(pointerIsOutsideInteraction({
    pointerType: 'touch', clientX: 100, clientY: 80
  }, element), false);
  assert.equal(pointerIsOutsideInteraction({
    pointerType: 'touch', clientX: 210, clientY: 80
  }, element), true);
  assert.equal(pointerIsOutsideInteraction({
    pointerType: 'pen', clientX: 100, clientY: 121
  }, element), true);
  assert.equal(pointerIsOutsideInteraction({
    pointerType: 'mouse', clientX: 500, clientY: 500
  }, element), false);
});

test('leaves clean overlay taps uncaptured while capturing globe gestures', () => {
  assert.equal(pointerNeedsViewportCapture({
    interactiveOverlay: true
  }), false);
  assert.equal(pointerNeedsViewportCapture({
    interactiveOverlay: false
  }), true);
  assert.equal(pointerNeedsViewportCapture({
    interactiveOverlay: true,
    moved: true
  }), true);
  assert.equal(pointerNeedsViewportCapture({
    interactiveOverlay: true,
    activePointerCount: 2
  }), true);
});

test('keeps a touch active while implicit label capture transfers to the viewport', () => {
  const viewport = {
    hasPointerCapture: (pointerId) => pointerId === 7
  };
  assert.equal(lostPointerCaptureEndsGesture({
    pointerId: 7,
    target: { className: 'globe-label' }
  }, viewport), false);
  assert.equal(lostPointerCaptureEndsGesture({
    pointerId: 7,
    target: viewport
  }, viewport), true);
  assert.equal(lostPointerCaptureEndsGesture({
    pointerId: 8,
    target: { className: 'globe-label' }
  }, viewport), true);
});

test('retains and deduplicates ancestor buildings during tile refinement', () => {
  const parentBuildings = { buildingCount: 4 };
  const childBuildings = { buildingCount: 2 };
  const unrelatedBuildings = { buildingCount: 3 };
  const resources = collectBuildingResources([
    {
      resolved: {
        fallbackLevels: 1,
        entry: {
          key: '14/1/2', tile: { x: 1, y: 2, z: 14 },
          auxiliary: parentBuildings
        }
      }
    },
    {
      resolved: {
        fallbackLevels: 1,
        entry: {
          key: '14/1/2', tile: { x: 1, y: 2, z: 14 },
          auxiliary: parentBuildings
        }
      }
    },
    {
      resolved: {
        fallbackLevels: 0,
        entry: {
          key: '15/3/4', tile: { x: 3, y: 4, z: 15 },
          auxiliary: childBuildings
        }
      }
    },
    {
      resolved: {
        fallbackLevels: 0,
        entry: {
          key: '15/8/9', tile: { x: 8, y: 9, z: 15 },
          auxiliary: unrelatedBuildings
        }
      }
    },
    { resolved: null }
  ]);

  assert.deepEqual(resources, [parentBuildings, unrelatedBuildings]);
});

test('requests direct leaves while retaining only a coarse coverage demand', () => {
  const tile = { x: 19, y: 10, z: 4, projectedPixels: 350 };

  assert.deepEqual(tileDemandsFor(tile, null), [
    { tile: { x: 1, y: 0, z: 0 }, priority: 200350, pin: true },
    { tile: { x: 19, y: 10, z: 4 }, priority: 100350, pin: true }
  ]);
  assert.deepEqual(tileDemandsFor(tile, { fallbackLevels: 3 }), [
    { tile: { x: 19, y: 10, z: 4 }, priority: 100350, pin: true }
  ]);
  assert.deepEqual(tileDemandsFor(tile, { fallbackLevels: 0 }), []);
});

test('does not start detailed work while refinement is blocked', () => {
  const tile = { x: 19, y: 10, z: 4, projectedPixels: 350 };
  assert.deepEqual(tileDemandsFor(tile, null, true), [
    { tile: { x: 1, y: 0, z: 0 }, priority: 200350, pin: true }
  ]);
  assert.deepEqual(tileDemandsFor(tile, { fallbackLevels: 3 }, true), []);
  assert.deepEqual(tileDemandsFor(tile, { fallbackLevels: 3 }, true, true), [
    { tile: { x: 19, y: 10, z: 4 }, priority: 100350, pin: true }
  ]);
});

test('prefetches one coarser level as a bounded zoom-out working set', () => {
  const tile = { x: 19, y: 10, z: 4, projectedPixels: 350 };
  assert.deepEqual(parentPrefetchDemandFor(tile), {
    tile: { x: 9, y: 5, z: 3 },
    priority: 50350,
    pin: true
  });
  assert.equal(parentPrefetchDemandFor({ x: 1, y: 0, z: 0 }), null);
});

test('subdivides a coarse transition tile into a non-overlapping child cover', () => {
  const grid = new PlateCarreeGrid();
  const children = transitionChildrenFor({
    x: 9,
    y: 5,
    z: 3,
    projectedPixels: 400
  }, grid);
  assert.deepEqual(children.map(({ x, y, z }) => ({ x, y, z })), [
    { x: 18, y: 10, z: 4 },
    { x: 19, y: 10, z: 4 },
    { x: 18, y: 11, z: 4 },
    { x: 19, y: 11, z: 4 }
  ]);
  assert.ok(children.every((child) => child.projectedPixels === 200));
  assert.equal(children[0].bounds.east, children[1].bounds.west);
  assert.equal(children[0].bounds.south, children[2].bounds.north);
});

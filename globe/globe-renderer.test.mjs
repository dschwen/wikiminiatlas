import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildingResources,
  distanceForAngularRadius,
  normalizeLightDirection,
  tileDemandsFor
} from './globe-renderer.mjs';

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
});

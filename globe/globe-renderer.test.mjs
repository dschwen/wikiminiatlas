import test from 'node:test';
import assert from 'node:assert/strict';

import { collectBuildingResources } from './globe-renderer.mjs';

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

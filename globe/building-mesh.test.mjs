import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBuildingMesh, parseBuildingHeight } from './building-mesh.mjs';

const zoom = 14;
const span = 60 / 2 ** zoom;
const longitude = 10;
const latitude = 50;
const tile = {
  x: Math.floor(longitude / span),
  y: Math.floor((90 - latitude) / span),
  z: zoom
};
const west = tile.x * span;
const north = 90 - tile.y * span;

function squareFeature(tags = { building: 'yes', height: '12 m' }, offset = 0.25) {
  const left = west + span * offset;
  const right = west + span * (offset + 0.25);
  const top = north - span * offset;
  const bottom = north - span * (offset + 0.25);
  return {
    tags,
    geo: {
      type: 'Polygon',
      coordinates: [[
        [left, top], [right, top], [right, bottom], [left, bottom], [left, top]
      ]]
    }
  };
}

function tileData(features) {
  return { ...tile, data: features };
}

test('parses legacy building height formats', () => {
  assert.equal(parseBuildingHeight('12.5 m'), 12.5);
  assert.ok(Math.abs(parseBuildingHeight(`10' 6"`) - 3.2004) < 1e-10);
  assert.equal(parseBuildingHeight('unknown'), null);
});

test('extrudes flat buildings into radial walls and a roof', () => {
  const mesh = buildBuildingMesh(tileData([squareFeature()]));
  assert.equal(mesh.buildingCount, 1);
  assert.equal(mesh.triangleCount, 10);
  assert.equal(mesh.vertexCount, 30);
  assert.equal(mesh.positions.length, mesh.normals.length);
  for (let index = 0; index < mesh.normals.length; index += 3) {
    assert.ok(Math.abs(Math.hypot(
      mesh.normals[index], mesh.normals[index + 1], mesh.normals[index + 2]
    ) - 1) < 1e-5);
  }
});

test('uses level heights, elevated minimum levels, and pyramidal roofs', () => {
  const mesh = buildBuildingMesh(tileData([squareFeature({
    building: 'yes',
    'building:levels': '5',
    'building:min_level': '1',
    'roof:shape': 'pyramidal',
    'roof:height': '3'
  })]));
  assert.equal(mesh.buildingCount, 1);
  assert.equal(mesh.triangleCount, 12);
});

test('ports rectangular gabled roofs', () => {
  const mesh = buildBuildingMesh(tileData([squareFeature({
    building: 'yes',
    height: '15',
    'roof:shape': 'gabled',
    'roof:height': '3'
  })]));
  assert.equal(mesh.buildingCount, 1);
  assert.equal(mesh.triangleCount, 14);
});

test('assigns padded building responses to one centroid tile', () => {
  const feature = squareFeature();
  const owner = buildBuildingMesh(tileData([feature]));
  const neighbor = buildBuildingMesh({ ...tileData([feature]), x: tile.x + 1 });
  assert.equal(owner.buildingCount, 1);
  assert.equal(neighbor.buildingCount, 0);
});

test('omits unheighted buildings and bounds per-tile triangles', () => {
  const unheighted = buildBuildingMesh(tileData([
    squareFeature({ building: 'yes' })
  ]));
  assert.equal(unheighted.vertexCount, 0);

  const bounded = buildBuildingMesh(tileData([squareFeature()]), {
    maximumTriangles: 3
  });
  assert.equal(bounded.triangleCount, 3);
  assert.equal(bounded.truncated, true);
});

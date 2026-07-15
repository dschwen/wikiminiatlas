import test from 'node:test';
import assert from 'node:assert/strict';

import {
  legacyLabelBatchUrl,
  legacyLabelCoordinates,
  normalizeLabel,
  projectGeographicPoint
} from './label-model.mjs';
import { lookAt, multiply, perspective } from './mat4.mjs';
import { PlateCarreeGrid, lonLatToUnitSphere } from './plate-carree-grid.mjs';

const grid = new PlateCarreeGrid();

test('builds batched label URLs with south-to-north service rows', () => {
  const url = new URL(legacyLabelBatchUrl('/label.php', {
    grid,
    tiles: [{ x: 4, y: 0, z: 0 }, { x: 5, y: 2, z: 0 }],
    language: 'de',
    globe: 'earth'
  }), 'https://example.test');
  assert.equal(url.searchParams.get('l'), 'de');
  assert.equal(url.searchParams.get('z'), '0');
  assert.equal(url.searchParams.get('r'), '4,2|5,0');
});

test('recovers geographic coordinates from legacy tile-local label fields', () => {
  assert.deepEqual(legacyLabelCoordinates({
    dx: 1,
    dy: 2,
    tx: 64,
    ty: 64,
    fx: 0,
    fy: 0
  }, 0, grid), {
    longitude: 90,
    latitude: 60
  });
});

test('prefers explicit coordinates and creates a stable compatibility id', () => {
  const label = normalizeLabel({
    name: 'Boise',
    page: 'Boise%2C_Idaho',
    lang: 'en',
    lat: '43.615',
    lon: '-116.2023',
    wg: '42',
    style: '8'
  }, 5, grid);
  assert.equal(label.latitude, 43.615);
  assert.ok(Math.abs(label.longitude - 243.7977) < 1e-10);
  assert.equal(label.weight, 42);
  assert.equal(label.id, 'en:Boise%2C_Idaho:43.615000:-116.202300');
});

test('projects the front surface and rejects labels behind the horizon', () => {
  const eyeDirection = lonLatToUnitSphere(0, 0);
  const distance = 3;
  const eye = eyeDirection.map((component) => component * distance);
  const matrix = multiply(
    perspective(42 * Math.PI / 180, 2, 0.1, 4.1),
    lookAt(eye, [0, 0, 0], [0, 1, 0])
  );
  const front = projectGeographicPoint({
    longitude: 0,
    latitude: 0,
    eyeDirection,
    distance,
    viewProjection: matrix,
    viewportWidth: 1000,
    viewportHeight: 500
  });
  assert.ok(front);
  assert.ok(Math.abs(front.x - 500) < 1e-4);
  assert.ok(Math.abs(front.y - 250) < 1e-4);
  assert.equal(projectGeographicPoint({
    longitude: 180,
    latitude: 0,
    eyeDirection,
    distance,
    viewProjection: matrix,
    viewportWidth: 1000,
    viewportHeight: 500
  }), null);
});

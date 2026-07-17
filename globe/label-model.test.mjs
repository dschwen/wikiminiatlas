import test from 'node:test';
import assert from 'node:assert/strict';

import {
  commonsFileUrl,
  commonsThumbnailFallbackUrl,
  commonsThumbnailUrl,
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

test('normalizes legacy Commons records as compact image labels', () => {
  const label = normalizeLabel({
    id: 'commons:7',
    img: 'Example.jpg',
    w: '1600',
    h: '1200',
    m5: 'ab',
    lat: '43.6',
    lon: '-116.2',
    wg: '42'
  }, 5, grid, 'commons');
  assert.equal(label.name, 'Example.jpg');
  assert.equal(label.page, 'Example.jpg');
  assert.deepEqual(label.thumbnail, {
    filename: 'Example.jpg',
    width: 48,
    height: 36,
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/' +
      'Example.jpg/120px-Example.jpg',
    fallbackUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' +
      'Example.jpg?width=120',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg'
  });
});

test('builds Commons URLs with the legacy thumbnail size presets', () => {
  assert.equal(
    commonsThumbnailUrl('Example.jpg', 121, 'ab'),
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/' +
      'Example.jpg/150px-Example.jpg'
  );
  assert.equal(
    commonsFileUrl('Example.jpg'),
    'https://commons.wikimedia.org/wiki/File:Example.jpg'
  );
});

test('builds page-one JPEG derivatives for Commons TIFF thumbnails', () => {
  const filename = 'Archival_scan%2C_Texas.tif';
  assert.equal(
    commonsThumbnailUrl(filename, 48, 'e1'),
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/' +
      `${filename}/lossy-page1-120px-${filename}.jpg`
  );
  assert.equal(
    commonsThumbnailFallbackUrl(filename, 48),
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/' +
      `${filename}?width=120`
  );
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

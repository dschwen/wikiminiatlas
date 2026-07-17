import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clipVisibleRing,
  GeometryOverlayLayer,
  projectUnitPoint,
  visibleLineFragments
} from './geometry-overlay-layer.mjs';
import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

test('clips lines and rings to the camera-visible spherical cap', () => {
  const eye = [1, 0, 0];
  const horizon = 0.5;
  const points = [-80, 0, 80].map((longitude) => lonLatToUnitSphere(longitude, 0));
  const fragments = visibleLineFragments(points, eye, horizon);
  assert.equal(fragments.length, 1);
  assert.ok(fragments[0].length >= 3);
  assert.ok(fragments[0].every((point) =>
    point[0] >= horizon - 1e-5
  ));

  const ring = [-80, -20, 20, 80].map((longitude, index) =>
    lonLatToUnitSphere(longitude, index % 2 === 0 ? -10 : 10)
  );
  const clipped = clipVisibleRing(ring, eye, horizon, 5 * Math.PI / 180);
  assert.ok(clipped.length >= 3);
  assert.ok(clipped.every((point) => point[0] >= horizon - 1e-5));
});

test('projects unit points through column-major view matrices', () => {
  const identity = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
  assert.deepEqual(projectUnitPoint([0, 0, 0], identity, 800, 600), {
    x: 400, y: 300
  });
});

test('renders available geometry once per camera state and supports toggling', () => {
  const calls = [];
  const context = {
    setTransform() {},
    clearRect() { calls.push('clear'); },
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
    fill() { calls.push('fill'); },
    stroke() { calls.push('stroke'); }
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  const availability = [];
  const layer = new GeometryOverlayLayer(canvas, {
    devicePixelRatio: () => 1,
    onAvailabilityChange: (available) => availability.push(available)
  });
  layer.setGeometry({
    coordinateCount: 2,
    lines: [[
      { longitude: -20, latitude: 0 },
      { longitude: 20, latitude: 0 }
    ]],
    polygons: []
  });
  const frame = {
    longitude: 0,
    latitude: 0,
    distance: 2,
    viewportWidth: 800,
    viewportHeight: 600,
    centerRadiansPerCssPixel: 0.001,
    eyeDirection: [1, 0, 0],
    viewProjection: new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])
  };
  layer.update(frame);
  const firstStrokeCount = calls.filter((call) => call === 'stroke').length;
  layer.update(frame);
  assert.equal(calls.filter((call) => call === 'stroke').length, firstStrokeCount);
  assert.deepEqual(availability, [true]);

  layer.setEnabled(false);
  assert.equal(calls.at(-1), 'clear');
  layer.destroy();
});

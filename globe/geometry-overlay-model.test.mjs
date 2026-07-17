import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeLegacyKmlOverlay,
  normalizeWiwosmGeoJson
} from './geometry-overlay-model.mjs';

const HALF_WORLD = 20037508.34;
const mercator = (longitude, latitude) => [
  longitude / 180 * HALF_WORLD,
  Math.log(Math.tan((90 + latitude) * Math.PI / 360)) / Math.PI * HALF_WORLD
];

test('normalizes WIWOSM collections, polygons, holes, and prime-meridian bounds', () => {
  const geometry = normalizeWiwosmGeoJson({
    type: 'GeometryCollection',
    geometries: [
      {
        type: 'LineString',
        coordinates: [mercator(-1, 0), mercator(1, 1)]
      },
      {
        type: 'Polygon',
        coordinates: [
          [mercator(-2, -1), mercator(2, -1), mercator(2, 2), mercator(-2, -1)],
          [mercator(-0.5, 0), mercator(0.5, 0), mercator(0, 0.5), mercator(-0.5, 0)]
        ]
      },
      { type: 'Point', coordinates: mercator(0, 0) }
    ]
  });

  assert.equal(geometry.lines.length, 1);
  assert.equal(geometry.polygons.length, 1);
  assert.equal(geometry.polygons[0].holes.length, 1);
  assert.ok(geometry.bounds.west <= 0 || geometry.bounds.west >= 358);
  assert.ok(geometry.bounds.east - geometry.bounds.west <= 4.01);
  assert.ok(Math.abs(geometry.lines[0][0].latitude) < 1e-9);
  assert.ok(geometry.view.angularRadius > 0);
});

test('keeps legacy KML paths continuous across the dateline', () => {
  const geometry = normalizeLegacyKmlOverlay({
    ways: [[{ lat: 5, lon: 179 }, { lat: 6, lon: -179 }]],
    areas: [{
      outer: [[
        { lat: 0, lon: 179 }, { lat: 0, lon: -179 },
        { lat: 2, lon: -179 }, { lat: 0, lon: 179 }
      ]],
      inner: []
    }]
  });

  assert.equal(geometry.lines[0][1].longitude, 181);
  assert.ok(geometry.bounds.east - geometry.bounds.west <= 2.01);
  assert.equal(geometry.polygons.length, 1);
});

test('rejects malformed and oversized overlay input', () => {
  assert.throws(() => normalizeLegacyKmlOverlay({ ways: {} }), /must be an array/);
  assert.throws(() => normalizeLegacyKmlOverlay({
    ways: [[{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }]]
  }, { maximumCoordinates: 1 }), /too many coordinates/);
  assert.throws(() => normalizeWiwosmGeoJson({
    type: 'CircularString', coordinates: []
  }), /unsupported/);
});

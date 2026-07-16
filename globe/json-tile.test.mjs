import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createJsonTileProducer,
  jsonTileUrl,
  renderJsonTile,
  validateJsonTile
} from './json-tile.mjs';

const requestedTile = { x: 4096, y: 2048, z: 13 };

function payload(features, extra = {}) {
  return {
    x: requestedTile.x,
    y: requestedTile.y,
    z: requestedTile.z,
    v: 2,
    data: features,
    idx: {},
    ...extra
  };
}

function polygonFeature(tags = { building: 'yes' }) {
  return {
    tags,
    geo: {
      type: 'Polygon',
      coordinates: [[
        [180, 45], [180.005, 45], [180.005, 44.995], [180, 45]
      ]]
    }
  };
}

test('validates the legacy JSON contract and builds old-response indexes', () => {
  const result = validateJsonTile(payload([
    polygonFeature({ building: 'yes', name: 'Test' })
  ], { v: 1, idx: undefined }), requestedTile);
  assert.deepEqual(result.index.building, [0]);
  assert.deepEqual(result.index.name, [0]);
  assert.equal(result.coordinateCount, 4);
});

test('rejects mismatched, excessive, and unsupported JSON data', () => {
  assert.throws(() => validateJsonTile(
    payload([], { x: requestedTile.x + 1 }), requestedTile
  ), /do not match/);
  assert.throws(() => validateJsonTile(
    payload([polygonFeature()]), requestedTile, { maximumFeatures: 0 }
  ), /too many features/);
  assert.throws(() => validateJsonTile(payload([{
    tags: {}, geo: { type: 'CircularString', coordinates: [] }
  }]), requestedTile), /unsupported geometry/);
});

test('renders GeoJSON into a canvas texture source', () => {
  const calls = [];
  const context = new Proxy({}, {
    get(target, property) {
      if (!(property in target)) {
        target[property] = (...args) => calls.push([property, ...args]);
      }
      return target[property];
    },
    set(target, property, value) {
      calls.push([`set:${property}`, value]);
      target[property] = value;
      return true;
    }
  });
  const canvas = { width: 0, height: 0, getContext: () => context };
  const data = validateJsonTile(payload([
    polygonFeature(),
    {
      tags: { highway: 'primary' },
      geo: { type: 'LineString', coordinates: [[180, 45], [180.005, 44.995]] }
    }
  ]), requestedTile);
  const result = renderJsonTile(data, { createCanvas: () => canvas });

  assert.equal(result, canvas);
  assert.equal(canvas.width, 128);
  assert.equal(canvas.height, 128);
  assert.ok(calls.some(([name, rule]) => name === 'fill' && rule === 'evenodd'));
  assert.ok(calls.some(([name]) => name === 'stroke'));
  assert.ok(calls.some(([name]) => name === 'lineTo'));
});

test('fetches, validates, and renders through a cancellable producer', async () => {
  const requests = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
      fill() {}, stroke() {}, setLineDash() {}
    })
  };
  const producer = createJsonTileProducer({
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        headers: { get: () => null },
        text: async () => JSON.stringify(payload([]))
      };
    },
    createCanvas: () => canvas
  });
  const controller = new AbortController();
  const result = await producer(
    requestedTile,
    '/tiles/jsontile.php?x=4096&y=2048&z=13',
    controller.signal
  );
  assert.equal(result, canvas);
  assert.equal(requests[0].options.signal, controller.signal);
  assert.equal(requests[0].options.credentials, 'same-origin');
});

test('builds JSON service URLs without string concatenation', () => {
  assert.equal(
    jsonTileUrl('/tiles/jsontile.php', { x: 4, y: 5, z: 13 }),
    '/tiles/jsontile.php?x=4&y=5&z=13'
  );
});

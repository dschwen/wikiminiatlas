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
    polygonFeature({ natural: 'water' }),
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

test('renders streets after land polygons regardless of server feature order', () => {
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
    {
      tags: { highway: 'primary' },
      geo: { type: 'LineString', coordinates: [[180, 45], [180.005, 44.995]] }
    },
    polygonFeature({ natural: 'land_polygons' })
  ]), requestedTile);
  renderJsonTile(data, { createCanvas: () => canvas });

  const landFill = calls.findIndex(([name, value]) =>
    name === 'set:fillStyle' && value === '#fafad0'
  );
  const roadStroke = calls.findIndex(([name, value]) =>
    name === 'set:strokeStyle' && value === '#e5ad75'
  );
  assert.ok(landFill >= 0);
  assert.ok(roadStroke > landFill);
});

test('renders all inland water polygons after land areas and before roads', () => {
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
    {
      tags: { highway: 'primary' },
      geo: { type: 'LineString', coordinates: [[180, 45], [180.005, 44.995]] }
    },
    polygonFeature({ natural: 'water' }),
    polygonFeature({ natural: 'land_polygons' }),
    polygonFeature({ landuse: 'reservoir' }),
    polygonFeature({ leisure: 'park' }),
    polygonFeature({ waterway: 'riverbank' })
  ]), requestedTile);
  renderJsonTile(data, { createCanvas: () => canvas });

  const landFill = calls.findIndex(([name, value]) =>
    name === 'set:fillStyle' && value === '#fafad0'
  );
  const areaFill = calls.findIndex(([name, value]) =>
    name === 'set:fillStyle' && value === '#c8e0c8'
  );
  const roadStroke = calls.findIndex(([name, value]) =>
    name === 'set:strokeStyle' && value === '#e5ad75'
  );
  const waterFills = calls
    .map(([name, value], index) => name === 'set:fillStyle' && value === '#9ec7f3' ? index : -1)
    .filter((index) => index > landFill);

  assert.equal(waterFills.length, 3);
  assert.ok(areaFill > landFill);
  assert.ok(waterFills.every((index) => index > areaFill && index < roadStroke));
});

test('keeps building features out of the JSON canvas texture', () => {
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
    polygonFeature({ building: 'yes', height: '12' })
  ]), requestedTile);
  renderJsonTile(data, { createCanvas: () => canvas });

  assert.equal(calls.filter(([name]) => name === 'fill').length, 0);
  assert.equal(calls.filter(([name]) => name === 'stroke').length, 0);
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

test('marks permanent HTTP failures so the resource cache will not retry them', async () => {
  const producer = createJsonTileProducer({
    fetchImpl: async () => ({ ok: false, status: 404 })
  });
  await assert.rejects(
    producer(requestedTile, '/missing', new AbortController().signal),
    (error) => error.status === 404 && error.retryable === false
  );
});

test('keeps throttling and server HTTP failures retryable', async () => {
  for (const status of [429, 503]) {
    const producer = createJsonTileProducer({
      fetchImpl: async () => ({ ok: false, status })
    });
    await assert.rejects(
      producer(requestedTile, '/retry', new AbortController().signal),
      (error) => error.status === status && error.retryable === true
    );
  }
});

test('returns bounded building geometry with detailed JSON textures', async () => {
  const detailedTile = { x: 2730, y: 10922, z: 14 };
  const detailedPayload = {
    x: detailedTile.x,
    y: detailedTile.y,
    z: detailedTile.z,
    v: 2,
    idx: { building: [0], height: [0] },
    data: [{
      tags: { building: 'yes', height: '12' },
      geo: {
        type: 'Polygon',
        coordinates: [[
          [10.0005, 49.9995], [10.001, 49.9995],
          [10.001, 49.999], [10.0005, 49.9995]
        ]]
      }
    }]
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
      fill() {}, stroke() {}, setLineDash() {}
    })
  };
  const producer = createJsonTileProducer({
    fetchImpl: async () => ({
      ok: true,
      headers: { get: () => null },
      text: async () => JSON.stringify(detailedPayload)
    }),
    createCanvas: () => canvas
  });
  const result = await producer(detailedTile, '/json', new AbortController().signal);
  assert.equal(result.source, canvas);
  assert.ok(result.auxiliary.vertexCount > 0);
});

test('builds JSON service URLs without string concatenation', () => {
  assert.equal(
    jsonTileUrl('/tiles/jsontile.php', { x: 4, y: 5, z: 13 }),
    '/tiles/jsontile.php?x=4&y=5&z=13'
  );
});

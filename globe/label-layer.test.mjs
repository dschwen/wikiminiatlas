import test from 'node:test';
import assert from 'node:assert/strict';

import { GlobeLabelLayer } from './label-layer.mjs';
import { lookAt, multiply, perspective } from './mat4.mjs';
import { PlateCarreeGrid, lonLatToUnitSphere } from './plate-carree-grid.mjs';

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
  }

  append(node) {
    node.parent = this;
    this.children.push(node);
  }

  replaceChildren() {
    this.children = [];
  }

  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((node) => node !== this);
    }
  }
}

global.HTMLElement = FakeElement;
global.document = { createElement: () => new FakeElement() };

const grid = new PlateCarreeGrid();

function frameState(labelTiles, refinementBlocked = false) {
  const eyeDirection = lonLatToUnitSphere(-112, 35);
  const distance = 3.1;
  const eye = eyeDirection.map((component) => component * distance);
  return {
    labelTiles,
    refinementBlocked,
    eyeDirection,
    distance,
    viewProjection: multiply(
      perspective(42 * Math.PI / 180, 1.5, 0.1, 4.2),
      lookAt(eye, [0, 0, 0], [0, 1, 0])
    ),
    viewportWidth: 900,
    viewportHeight: 600
  };
}

test('batches ten label tiles per request and bounds concurrent batches', () => {
  const requests = [];
  const layer = new GlobeLabelLayer(new FakeElement(), {
    grid,
    maximumConcurrentRequests: 2,
    fetchImpl: (url, options) => {
      requests.push({ url, options });
      return new Promise(() => {});
    }
  });
  const tiles = Array.from({ length: 25 }, (_, x) => ({ x, y: 3, z: 2 }));
  layer.update(frameState(tiles));

  assert.equal(requests.length, 2);
  assert.equal(layer.loads.size, 2);
  for (const request of requests) {
    const url = new URL(request.url, 'https://example.test');
    assert.equal(url.searchParams.get('r').split('|').length, 10);
  }
  layer.destroy();
});

test('renders successful candidates as projected accessible links', async () => {
  const container = new FakeElement();
  const layer = new GlobeLabelLayer(container, {
    grid,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        label: [{
          id: 'en:boise',
          name: 'Boise',
          page: 'Boise%2C_Idaho',
          lang: 'en',
          lat: 43.615,
          lon: -116.2023,
          dx: 16,
          dy: 8,
          style: 9,
          wg: 100
        }]
      })
    })
  });
  layer.update(frameState([{ x: 16, y: 3, z: 2 }]));
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].textContent, 'Boise');
  assert.equal(
    container.children[0].href,
    'https://en.wikipedia.org/wiki/Boise%2C_Idaho'
  );
  assert.match(container.children[0].style.transform, /^translate3d\(/);
  layer.destroy();
});

test('retains the active label snapshot through gestures and replacement loading', async () => {
  const container = new FakeElement();
  let requestCount = 0;
  let resolveReplacement;
  const responseFor = (label) => ({
    ok: true,
    json: async () => ({ label: [label] })
  });
  const layer = new GlobeLabelLayer(container, {
    grid,
    fetchImpl: async () => {
      requestCount += 1;
      if (requestCount === 1) {
        return responseFor({
          id: 'en:boise', name: 'Boise', page: 'Boise%2C_Idaho', lang: 'en',
          lat: 43.615, lon: -116.2023, dx: 16, dy: 8, style: 9, wg: 100
        });
      }
      return new Promise((resolve) => { resolveReplacement = resolve; });
    }
  });

  layer.update(frameState([{ x: 16, y: 3, z: 2 }]));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(container.children[0].textContent, 'Boise');

  layer.update(frameState([{ x: 17, y: 3, z: 2 }], true));
  assert.equal(requestCount, 1);
  assert.equal(container.children[0].textContent, 'Boise');

  layer.update(frameState([{ x: 17, y: 3, z: 2 }]));
  assert.equal(requestCount, 2);
  assert.equal(container.children[0].textContent, 'Boise');

  resolveReplacement(responseFor({
    id: 'en:replacement', name: 'Replacement', page: 'Replacement', lang: 'en',
    lat: 40, lon: -100, dx: 17, dy: 8, style: 7, wg: 100
  }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].textContent, 'Replacement');
  layer.destroy();
});

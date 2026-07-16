import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ancestorsFromRoot,
  TileResourceManager,
  textureTransformForAncestor
} from './tile-resource-manager.mjs';

function makeFakeGl() {
  let nextTexture = 1;
  return {
    TEXTURE_2D: 1,
    TEXTURE_WRAP_S: 2,
    TEXTURE_WRAP_T: 3,
    CLAMP_TO_EDGE: 4,
    TEXTURE_MIN_FILTER: 5,
    TEXTURE_MAG_FILTER: 6,
    LINEAR: 7,
    UNPACK_FLIP_Y_WEBGL: 8,
    RGBA: 9,
    UNSIGNED_BYTE: 10,
    deleted: [],
    createTexture() { return { id: nextTexture++ }; },
    bindTexture() {},
    texParameteri() {},
    pixelStorei() {},
    texImage2D() {},
    deleteTexture(texture) { this.deleted.push(texture); }
  };
}

function makeHarness(options = {}) {
  const images = [];
  const gl = makeFakeGl();
  const manager = new TileResourceManager({
    gl,
    tileKey: (x, y, z) => `${z}/${x}/${y}`,
    tileUrl: ({ x, y, z }) => `/tiles/${z}/${x}/${y}.png`,
    createImage: () => {
      const image = {
        naturalWidth: 128,
        naturalHeight: 128,
        src: '',
        onload: null,
        onerror: null,
        decoding: '',
        crossOrigin: ''
      };
      images.push(image);
      return image;
    },
    ...options
  });
  return { gl, images, manager };
}

test('builds root-first ancestry and exact parent UV transforms', () => {
  const leaf = { x: 19, y: 10, z: 4 };
  assert.deepEqual(ancestorsFromRoot(leaf), [
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 1, z: 1 },
    { x: 4, y: 2, z: 2 },
    { x: 9, y: 5, z: 3 },
    leaf
  ]);
  assert.deepEqual(textureTransformForAncestor(leaf, { x: 4, y: 2, z: 2 }), {
    offsetX: 0.75,
    offsetY: 0.5,
    scaleX: 0.25,
    scaleY: 0.25
  });
});

test('limits concurrent requests and releases decoded images after upload', () => {
  const { images, manager } = makeHarness({ maximumConcurrentRequests: 2 });
  manager.beginFrame();
  for (let x = 0; x < 4; x += 1) {
    manager.demand({ x, y: 0, z: 0 }, { priority: 10 - x });
  }
  manager.endFrame();
  assert.equal(images.length, 2);
  assert.equal(manager.stats().inFlight, 2);
  assert.equal(manager.stats().queued, 2);

  const firstEntry = manager.entries.get('0/0/0');
  images[0].onload();
  assert.equal(firstEntry.status, 'ready');
  assert.equal(firstEntry.image, null);
  assert.equal(images.length, 3);
  assert.equal(manager.stats().inFlight, 2);
});

test('resolves a detailed leaf through its closest ready ancestor', () => {
  const { images, manager } = makeHarness();
  manager.beginFrame();
  manager.demand({ x: 4, y: 2, z: 2 });
  manager.endFrame();
  images[0].onload();

  manager.beginFrame();
  const resolved = manager.resolve({ x: 19, y: 10, z: 4 });
  assert.equal(resolved.entry.key, '2/4/2');
  assert.equal(resolved.fallbackLevels, 2);
  assert.deepEqual(resolved.transform, {
    offsetX: 0.75,
    offsetY: 0.5,
    scaleX: 0.25,
    scaleY: 0.25
  });
});

test('evicts least-recently-used textures while preserving pinned entries', () => {
  const { gl, images, manager } = makeHarness({
    maximumConcurrentRequests: 3,
    maximumResidentTextures: 2,
    maximumTextureBytes: Infinity
  });
  manager.beginFrame();
  manager.demand({ x: 0, y: 0, z: 0 }, { priority: 3, pin: true });
  manager.demand({ x: 1, y: 0, z: 0 }, { priority: 2 });
  manager.demand({ x: 2, y: 0, z: 0 }, { priority: 1 });
  manager.endFrame();
  images[0].onload();
  images[1].onload();
  images[2].onload();

  assert.equal(manager.stats().residentTextures, 2);
  assert.equal(manager.entries.get('0/0/0').status, 'ready');
  assert.equal(gl.deleted.length, 1);
});

test('cancels stale in-flight requests after the configured grace period', () => {
  const { images, manager } = makeHarness({
    maximumConcurrentRequests: 1,
    cancellationGraceFrames: 0
  });
  manager.beginFrame();
  manager.demand({ x: 0, y: 0, z: 0 });
  manager.endFrame();
  assert.equal(manager.stats().inFlight, 1);

  manager.beginFrame();
  manager.endFrame();
  assert.equal(manager.stats().inFlight, 0);
  assert.equal(images[0].src, '');
  assert.equal(manager.entries.get('0/0/0').status, 'idle');
});

test('uploads asynchronous canvas producers through the same texture cache', async () => {
  const produced = [];
  const { manager } = makeHarness({
    tileProducer: async (tile, url, signal) => {
      produced.push({ tile, url, signal });
      return { width: 256, height: 128 };
    }
  });
  manager.beginFrame();
  manager.demand({ x: 3, y: 2, z: 4 });
  manager.endFrame();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(produced.length, 1);
  assert.equal(produced[0].url, '/tiles/4/3/2.png');
  assert.equal(manager.entries.get('4/3/2').status, 'ready');
  assert.equal(manager.entries.get('4/3/2').bytes, 256 * 128 * 4);
  assert.equal(manager.stats().inFlight, 0);
});

test('aborts asynchronous producers that leave the desired generation', async () => {
  let signal;
  const { manager } = makeHarness({
    cancellationGraceFrames: 0,
    tileProducer: (tile, url, producerSignal) => {
      signal = producerSignal;
      return new Promise(() => {});
    }
  });
  manager.beginFrame();
  manager.demand({ x: 0, y: 0, z: 0 });
  manager.endFrame();
  await Promise.resolve();
  assert.equal(manager.stats().inFlight, 1);

  manager.beginFrame();
  manager.endFrame();
  assert.equal(signal.aborted, true);
  assert.equal(manager.stats().inFlight, 0);
  assert.equal(manager.entries.get('0/0/0').status, 'idle');
});

test('accounts for and deletes tile-owned auxiliary GPU resources', async () => {
  const deleted = [];
  const { manager } = makeHarness({
    maximumResidentTextures: 1,
    maximumTextureBytes: Infinity,
    tileProducer: async () => ({
      source: { width: 128, height: 128 },
      auxiliary: { vertexCount: 30 }
    }),
    uploadAuxiliary: (mesh) => ({ ...mesh, bytes: 720 }),
    deleteAuxiliary: (resource) => deleted.push(resource)
  });

  manager.beginFrame();
  manager.demand({ x: 0, y: 0, z: 0 });
  manager.demand({ x: 1, y: 0, z: 0 });
  manager.endFrame();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(manager.stats().residentTextures, 1);
  assert.equal(manager.stats().residentAuxiliary, 1);
  assert.equal(manager.stats().residentAuxiliaryBytes, 720);
  assert.equal(deleted.length, 1);

  manager.destroy();
  assert.equal(deleted.length, 2);
});

test('enforces the auxiliary budget even for currently pinned surface tiles', async () => {
  const deleted = [];
  const { gl, manager } = makeHarness({
    maximumAuxiliaryBytes: 1000,
    tileProducer: async () => ({
      source: { width: 128, height: 128 },
      auxiliary: { vertexCount: 30 }
    }),
    uploadAuxiliary: (mesh) => ({ ...mesh, bytes: 720 }),
    deleteAuxiliary: (resource) => deleted.push(resource)
  });
  manager.beginFrame();
  manager.demand({ x: 0, y: 0, z: 0 }, { pin: true });
  manager.demand({ x: 1, y: 0, z: 0 }, { pin: true });
  manager.endFrame();
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(manager.stats().residentAuxiliaryBytes <= 1000);
  assert.equal(manager.stats().residentTextures, 2);
  assert.equal(gl.deleted.length, 0);
  assert.equal(deleted.length, 1);
});

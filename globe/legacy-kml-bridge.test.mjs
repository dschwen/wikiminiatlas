import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LegacyKmlBridge,
  parentOriginFrom,
  parseLegacyKmlMessage
} from './legacy-kml-bridge.mjs';

test('derives and validates parent origins', () => {
  assert.equal(parentOriginFrom({ referrer: 'https://en.wikipedia.org/wiki/Test' }),
    'https://en.wikipedia.org');
  assert.equal(parentOriginFrom({ explicitOrigin: 'https://example.test/path' }),
    'https://example.test');
  assert.equal(parentOriginFrom({ explicitOrigin: 'not a URL' }), null);
});

test('parses only legacy geometry messages', () => {
  assert.equal(parseLegacyKmlMessage('request'), null);
  assert.equal(parseLegacyKmlMessage(JSON.stringify({ coords: [] })), null);
  const geometry = parseLegacyKmlMessage(JSON.stringify({
    ways: [[{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }]], areas: []
  }));
  assert.equal(geometry.lines.length, 1);
});

test('accepts geometry only from the configured parent and requests compat data', () => {
  const listeners = new Map();
  const sent = [];
  const parent = { postMessage: (...args) => sent.push(args) };
  const windowObject = {
    parent,
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name)
  };
  const received = [];
  const bridge = new LegacyKmlBridge({
    windowObject,
    expectedOrigin: 'https://en.wikipedia.org',
    onGeometry: (geometry) => received.push(geometry)
  });
  bridge.requestGeometry();
  assert.deepEqual(sent, [['request', 'https://en.wikipedia.org']]);

  const message = JSON.stringify({
    ways: [[{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }]], areas: []
  });
  listeners.get('message')({ source: {}, origin: 'https://en.wikipedia.org', data: message });
  listeners.get('message')({ source: parent, origin: 'https://evil.test', data: message });
  listeners.get('message')({ source: parent, origin: 'https://en.wikipedia.org', data: message });
  assert.equal(received.length, 1);
  bridge.destroy();
  assert.equal(listeners.has('message'), false);
});

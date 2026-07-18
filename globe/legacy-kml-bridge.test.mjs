import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LegacyKmlBridge,
  parentOriginFrom,
  parseLegacyCoordinateMessage,
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

test('validates legacy article coordinates while preserving host indexes', () => {
  assert.equal(parseLegacyCoordinateMessage('request'), null);
  assert.deepEqual(parseLegacyCoordinateMessage(JSON.stringify({
    coords: [
      { lat: 10, lon: 20, title: 'First' },
      { lat: 100, lon: 30, title: 'Invalid' },
      { lat: -5, lon: 40, title: 'Third' }
    ]
  })), [
    { index: 0, latitude: 10, longitude: 20, title: 'First' },
    { index: 2, latitude: -5, longitude: 40, title: 'Third' }
  ]);
  assert.throws(
    () => parseLegacyCoordinateMessage({ coords: [{}, {}] }, {
      maximumCoordinates: 1
    }),
    /too many coordinates/
  );
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
  const receivedCoordinates = [];
  const bridge = new LegacyKmlBridge({
    windowObject,
    expectedOrigin: 'https://en.wikipedia.org',
    onGeometry: (geometry) => received.push(geometry),
    onCoordinates: (coordinates) => receivedCoordinates.push(coordinates)
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
  listeners.get('message')({
    source: parent,
    origin: 'https://en.wikipedia.org',
    data: JSON.stringify({ coords: [{ lat: 1, lon: 2, title: 'Point' }] })
  });
  assert.equal(receivedCoordinates.length, 1);

  bridge.postMarkerEvent('highlight', 3);
  bridge.postMarkerEvent('unhighlight', 3);
  bridge.postMarkerEvent('scroll', 3);
  assert.deepEqual(sent.slice(1), [
    ['highlight, 3', 'https://en.wikipedia.org'],
    ['unhighlight, 3', 'https://en.wikipedia.org'],
    ['scroll, 3', 'https://en.wikipedia.org']
  ]);
  assert.throws(() => bridge.postMarkerEvent('unknown', 3), /invalid/);
  bridge.destroy();
  assert.equal(listeners.has('message'), false);
});

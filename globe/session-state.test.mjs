import test from 'node:test';
import assert from 'node:assert/strict';

import { readCameraState, writeCameraState } from './session-state.mjs';

test('round-trips camera state without replacing unrelated history data', () => {
  const state = writeCameraState({ host: { selected: 4 } }, {
    latitude: 43.615,
    longitude: 243.7977,
    distance: 1.25
  });
  assert.deepEqual(state.host, { selected: 4 });
  assert.deepEqual(readCameraState(state), {
    latitude: 43.615,
    longitude: 243.7977,
    distance: 1.25
  });
});

test('rejects missing, obsolete, and invalid camera state', () => {
  assert.equal(readCameraState(null), null);
  assert.equal(readCameraState({ wikiminiatlasGlobeCamera: { version: 0 } }), null);
  assert.equal(readCameraState({
    wikiminiatlasGlobeCamera: {
      version: 1,
      latitude: 0,
      longitude: 0,
      distance: 1
    }
  }), null);
});

const CAMERA_STATE_KEY = 'wikiminiatlasGlobeCamera';

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function readCameraState(historyState) {
  if (!historyState || typeof historyState !== 'object') {
    return null;
  }
  const stored = historyState[CAMERA_STATE_KEY];
  if (!stored || stored.version !== 1) {
    return null;
  }
  const latitude = finiteNumber(stored.latitude);
  const longitude = finiteNumber(stored.longitude);
  const distance = finiteNumber(stored.distance);
  if (latitude === null || longitude === null || distance === null || distance <= 1) {
    return null;
  }
  return { latitude, longitude, distance };
}

export function writeCameraState(historyState, camera) {
  const previous = historyState && typeof historyState === 'object'
    ? historyState
    : {};
  return {
    ...previous,
    [CAMERA_STATE_KEY]: {
      version: 1,
      latitude: camera.latitude,
      longitude: camera.longitude,
      distance: camera.distance
    }
  };
}

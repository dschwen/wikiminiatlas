const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function assertPositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}

/**
 * Select a tile level from the projected pixel density at the point on the
 * sphere directly below the camera.
 */
export function selectTileZoom({
  viewportHeight,
  distance,
  fieldOfViewRadians,
  baseTileDegrees,
  tileSize,
  maximumZoom,
  targetScreenPixelsPerTexel = 0.75
}) {
  assertPositive(viewportHeight, 'viewportHeight');
  assertPositive(distance - 1, 'camera altitude');
  assertPositive(fieldOfViewRadians, 'fieldOfViewRadians');
  assertPositive(baseTileDegrees, 'baseTileDegrees');
  assertPositive(tileSize, 'tileSize');
  assertPositive(targetScreenPixelsPerTexel, 'targetScreenPixelsPerTexel');
  if (!Number.isInteger(maximumZoom) || maximumZoom < 0) {
    throw new RangeError('maximumZoom must be a non-negative integer');
  }

  const frontSurfaceDistance = distance - 1;
  const pixelsPerWorldUnit = viewportHeight /
    (2 * Math.tan(fieldOfViewRadians / 2) * frontSurfaceDistance);
  const baseTilePixels = baseTileDegrees * DEG_TO_RAD * pixelsPerWorldUnit;
  const desiredTilePixels = tileSize * targetScreenPixelsPerTexel;
  const unconstrainedZoom = Math.ceil(Math.log2(baseTilePixels / desiredTilePixels));
  const zoom = clamp(unconstrainedZoom, 0, maximumZoom);

  return {
    zoom,
    frontTilePixels: baseTilePixels / (2 ** zoom),
    pixelsPerRadian: pixelsPerWorldUnit
  };
}

/**
 * Convert a pointer movement into approximately one front-surface screen
 * footprint. Sensitivity falls linearly with altitude for close-up control.
 */
export function rotationDegreesPerPixel({
  viewportHeight,
  distance,
  fieldOfViewRadians,
  maximumDegreesPerPixel = 1
}) {
  assertPositive(viewportHeight, 'viewportHeight');
  assertPositive(distance - 1, 'camera altitude');
  assertPositive(fieldOfViewRadians, 'fieldOfViewRadians');

  const visibleFrontRadians =
    2 * Math.tan(fieldOfViewRadians / 2) * (distance - 1);
  return Math.min(
    maximumDegreesPerPixel,
    visibleFrontRadians * RAD_TO_DEG / viewportHeight
  );
}

/**
 * Wheel zoom is exponential in altitude above the surface. Scaling distance
 * from the planet center would become uncontrollable as distance approaches 1.
 */
export function distanceAfterWheel({
  distance,
  deltaY,
  minimumAltitude = 0.0005,
  maximumAltitude = 50,
  speed = 0.002
}) {
  assertPositive(distance - 1, 'camera altitude');
  assertPositive(minimumAltitude, 'minimumAltitude');
  assertPositive(maximumAltitude, 'maximumAltitude');
  assertPositive(speed, 'speed');
  if (maximumAltitude < minimumAltitude) {
    throw new RangeError('maximumAltitude must not be less than minimumAltitude');
  }

  const exponent = clamp(deltaY * speed, -1, 1);
  const altitude = clamp(
    (distance - 1) * Math.exp(exponent),
    minimumAltitude,
    maximumAltitude
  );
  return 1 + altitude;
}


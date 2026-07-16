import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

const DEG_TO_RAD = Math.PI / 180;
const JULIAN_DATE_UNIX_EPOCH = 2440587.5;
const JULIAN_DATE_J2000 = 2451545.0;
const MILLISECONDS_PER_DAY = 86400000;

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function signedDegrees(value) {
  const normalized = normalizeDegrees(value);
  return normalized >= 180 ? normalized - 360 : normalized;
}

function timestampFor(date) {
  const timestamp = date instanceof Date ? date.getTime() : Number(date);
  if (!Number.isFinite(timestamp)) {
    throw new TypeError('solar position requires a valid date or timestamp');
  }
  return timestamp;
}

/**
 * Approximate geocentric position directly beneath the Sun on Earth.
 * Accuracy is substantially better than the visual resolution needed by the
 * once-per-minute directional globe light, without requiring network data.
 */
export function subsolarPointAt(date = new Date()) {
  const julianDate = timestampFor(date) / MILLISECONDS_PER_DAY +
    JULIAN_DATE_UNIX_EPOCH;
  const daysSinceJ2000 = julianDate - JULIAN_DATE_J2000;

  const meanLongitude = normalizeDegrees(280.460 + 0.9856474 * daysSinceJ2000);
  const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * daysSinceJ2000) *
    DEG_TO_RAD;
  const eclipticLongitude = (
    meanLongitude + 1.915 * Math.sin(meanAnomaly) +
    0.020 * Math.sin(2 * meanAnomaly)
  ) * DEG_TO_RAD;
  const obliquity = (23.439 - 0.0000004 * daysSinceJ2000) * DEG_TO_RAD;

  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude)
  );
  const declination = Math.asin(
    Math.sin(obliquity) * Math.sin(eclipticLongitude)
  );

  const centuriesSinceJ2000 = daysSinceJ2000 / 36525;
  const greenwichSiderealDegrees = normalizeDegrees(
    280.46061837 + 360.98564736629 * daysSinceJ2000 +
    0.000387933 * centuriesSinceJ2000 ** 2 -
    centuriesSinceJ2000 ** 3 / 38710000
  );

  return {
    latitude: declination / DEG_TO_RAD,
    longitude: signedDegrees(rightAscension / DEG_TO_RAD - greenwichSiderealDegrees)
  };
}

export function sunDirectionAt(date = new Date()) {
  const point = subsolarPointAt(date);
  return lonLatToUnitSphere(point.longitude, point.latitude);
}

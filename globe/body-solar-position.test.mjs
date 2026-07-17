import test from 'node:test';
import assert from 'node:assert/strict';

import {
  subEarthPointOnMoon,
  subsolarPointForBody,
  sunDirectionForBody
} from './body-solar-position.mjs';
import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

function longitudeDifference(first, second) {
  return Math.abs(((first - second + 540) % 360) - 180);
}

const REFERENCE_DATE = new Date('2026-07-16T18:00:00Z');

// Fixed JPL Horizons quantity-15 reference values. For Mars, Io, and Titan,
// the observer is a nearby satellite/primary so apparent Earth light-time
// does not shift the rapidly rotating target. Tolerances include the expected
// error of JPL's compact analytical planetary-position model.
const HORIZONS_REFERENCES = [
  ['moon', 153.729240, 0.910392, 0.05],
  ['mercury', -40.268829, -0.034049, 0.1],
  ['venus', -150.854807, -0.236024, 0.1],
  ['mars', -5.136615, -16.148475, 0.5],
  ['io', -76.913706, 0.692612, 0.3],
  ['titan', 92.066987, -6.680814, 0.1]
];

test('approximates JPL body-fixed subsolar coordinates without ephemeris data', () => {
  for (const [body, longitude, latitude, tolerance] of HORIZONS_REFERENCES) {
    const point = subsolarPointForBody(body, REFERENCE_DATE);
    assert.ok(
      longitudeDifference(point.longitude, longitude) < tolerance,
      `${body} longitude ${point.longitude} should be within ${tolerance}° of ${longitude}`
    );
    assert.ok(
      Math.abs(point.latitude - latitude) < tolerance,
      `${body} latitude ${point.latitude} should be within ${tolerance}° of ${latitude}`
    );
  }
});

test('returns finite unit vectors for every globe body', () => {
  for (const body of ['earth', 'moon', 'mercury', 'venus', 'mars', 'io', 'titan']) {
    const direction = sunDirectionForBody(body, REFERENCE_DATE);
    assert.equal(direction.length, 3);
    assert.ok(direction.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...direction) - 1) < 1e-12);
  }
});

test('approximates the JPL Horizons sub-Earth point on the Moon', () => {
  // Quantity 14, geocentric observer, at REFERENCE_DATE.
  const point = subEarthPointOnMoon(REFERENCE_DATE);
  assert.ok(longitudeDifference(point.longitude, 5.970045) < 0.5);
  assert.ok(Math.abs(point.latitude - (-0.464505)) < 0.1);
});

test('puts the lit hemisphere behind and in front of the Earth view at lunar phases', () => {
  const phaseAlignment = (date) => {
    const earthPoint = subEarthPointOnMoon(date);
    const earthDirection = lonLatToUnitSphere(earthPoint.longitude, earthPoint.latitude);
    const sunDirection = sunDirectionForBody('moon', date);
    return earthDirection.reduce(
      (sum, component, index) => sum + component * sunDirection[index],
      0
    );
  };
  assert.ok(phaseAlignment(new Date('2024-04-08T18:00:00Z')) < -0.99);
  assert.ok(phaseAlignment(new Date('2024-04-23T23:49:00Z')) > 0.99);
});

test('rejects unsupported bodies and invalid dates', () => {
  assert.throws(
    () => sunDirectionForBody('pluto', REFERENCE_DATE),
    /unsupported solar direction body/
  );
  assert.throws(
    () => sunDirectionForBody('moon', new Date('invalid')),
    /valid date/
  );
});

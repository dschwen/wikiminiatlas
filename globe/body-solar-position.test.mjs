import test from 'node:test';
import assert from 'node:assert/strict';

import {
  subsolarPointForBody,
  sunDirectionForBody
} from './body-solar-position.mjs';

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

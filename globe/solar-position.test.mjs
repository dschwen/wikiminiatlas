import test from 'node:test';
import assert from 'node:assert/strict';

import { subsolarPointAt, sunDirectionAt } from './solar-position.mjs';

test('tracks the equinox subsolar point across Earth', () => {
  const midnight = subsolarPointAt(new Date('2024-03-20T00:00:00Z'));
  const noon = subsolarPointAt(new Date('2024-03-20T12:00:00Z'));

  assert.ok(Math.abs(midnight.latitude) < 0.2);
  assert.ok(Math.abs(noon.latitude) < 0.2);
  assert.ok(Math.abs(Math.abs(midnight.longitude) - 180) < 3);
  assert.ok(Math.abs(noon.longitude) < 3);
});

test('tracks the seasonal solar declination', () => {
  const june = subsolarPointAt(new Date('2024-06-20T20:51:00Z'));
  const december = subsolarPointAt(new Date('2024-12-21T09:21:00Z'));

  assert.ok(Math.abs(june.latitude - 23.44) < 0.2);
  assert.ok(Math.abs(december.latitude + 23.44) < 0.2);
});

test('returns a finite unit direction and rejects invalid dates', () => {
  const direction = sunDirectionAt(new Date('2024-06-20T20:51:00Z'));
  assert.equal(direction.length, 3);
  assert.ok(direction.every(Number.isFinite));
  assert.ok(Math.abs(Math.hypot(...direction) - 1) < 1e-12);
  assert.throws(() => sunDirectionAt(new Date('invalid')), /valid date/);
});

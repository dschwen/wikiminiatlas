import test from 'node:test';
import assert from 'node:assert/strict';

import { scaleBarsForCenter, selectNiceScale } from './scale-bar.mjs';

test('selects the largest legacy 1/2/5 scale shorter than the target', () => {
  assert.deepEqual(selectNiceScale(2), { value: 100, pixels: 50 });
  assert.deepEqual(selectNiceScale(0.3), {
    value: 10,
    pixels: 10 / 0.3
  });
  assert.deepEqual(selectNiceScale(0.12), {
    value: 5,
    pixels: 5 / 0.12
  });
});

test('builds independent metric and imperial scales from center resolution', () => {
  const scale = scaleBarsForCenter({
    centerRadiansPerPixel: 0.00001,
    equatorialCircumferenceKm: 40075
  });
  assert.ok(Math.abs(scale.kilometersPerPixel - 0.0637814) < 0.000001);
  assert.equal(scale.metric.label, '2 km');
  assert.ok(Math.abs(scale.metric.pixels - 31.357) < 0.01);
  assert.equal(scale.imperial.label, '1 mi');
  assert.ok(Math.abs(scale.imperial.pixels - 25.229) < 0.01);
});

test('formats sub-kilometer metric distances as meters', () => {
  const scale = scaleBarsForCenter({
    centerRadiansPerPixel: 0.0000001,
    equatorialCircumferenceKm: 40075
  });
  assert.equal(scale.metric.label, '20 m');
  assert.equal(scale.imperial.label, '0.01 mi');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { legacyCameraDistance, parseGlobeUrl } from './url-compat.mjs';

test('parses the exact URL emitted by the legacy Wikipedia embedder', () => {
  const state = parseGlobeUrl(
    'https://wma.test/globe/?wma=43.615_-116.2023_600_400_de_7_fr' +
      '&globe=Moon&lang=de&page=Boise&awt=1',
    { viewportHeight: 400 }
  );
  assert.equal(state.legacy, true);
  assert.deepEqual(state.marker, { latitude: 43.615, longitude: -116.2023 });
  assert.deepEqual(state.center, state.marker);
  assert.equal(state.requestedWidth, 600);
  assert.equal(state.requestedHeight, 400);
  assert.equal(state.labelLanguage, 'de');
  assert.equal(state.uiLanguage, 'fr');
  assert.equal(state.globe, 'Moon');
  assert.equal(state.articleLanguage, 'de');
  assert.equal(state.articlePage, 'Boise');
  assert.equal(state.alwaysTooltips, true);
  assert.equal(state.distance, legacyCameraDistance({ zoom: 7, viewportHeight: 400 }));
});

test('accepts the old raw coordinate query and explicit map center', () => {
  const state = parseGlobeUrl(
    'https://wma.test/globe/?10_20_600_400_en_4_de_-5_175&globe=Mars'
  );
  assert.equal(state.legacy, true);
  assert.deepEqual(state.marker, { latitude: 10, longitude: 20 });
  assert.deepEqual(state.center, { latitude: -5, longitude: 175 });
  assert.equal(state.labelLanguage, 'en');
  assert.equal(state.globe, 'Mars');
});

test('keeps modern parameters while separating article and label languages', () => {
  const state = parseGlobeUrl(
    'https://wma.test/globe/?lat=1&lon=2&distance=1.25&lang=de&labelLang=fr&labels=0' +
      '&lighting=realistic'
  );
  assert.equal(state.legacy, false);
  assert.deepEqual(state.marker, { latitude: 1, longitude: 2 });
  assert.equal(state.distance, 1.25);
  assert.equal(state.articleLanguage, 'de');
  assert.equal(state.labelLanguage, 'fr');
  assert.equal(state.labelsEnabled, false);
  assert.equal(state.realisticLighting, true);
});

test('preserves an explicit distance within the extended Earth zoom range', () => {
  const state = parseGlobeUrl(
    'https://wma.test/globe/?distance=1.0000625'
  );
  assert.equal(state.distance, 1.0000625);
});

test('does not interpret missing modern coordinates as zero', () => {
  const state = parseGlobeUrl('https://wma.test/globe/?labels=0');
  assert.deepEqual(state.marker, { latitude: 35, longitude: -112 });
  assert.deepEqual(state.center, state.marker);
  assert.equal(state.realisticLighting, false);
});

test('matches legacy zoom resolution to the globe center', () => {
  const distance = legacyCameraDistance({ zoom: 8, viewportHeight: 400 });
  const radiansPerPixel = 2 * Math.tan(42 * Math.PI / 360) * (distance - 1) / 400;
  assert.ok(Math.abs(radiansPerPixel - 2 * Math.PI / (6 * 128 * 2 ** 8)) < 1e-15);
});

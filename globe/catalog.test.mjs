import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LABEL_LANGUAGES,
  legacyTileSourceUrl,
  TILE_SOURCES,
  tileSourceById
} from './catalog.mjs';

test('catalog retains the six legacy Earth raster layers', () => {
  assert.deepEqual(TILE_SOURCES.map((source) => source.id), [
    'mapnik', 'physical', 'satellite', 'coastline', 'blue-marble', 'night'
  ]);
  assert.equal(tileSourceById('missing').id, 'mapnik');
});

test('builds each legacy tile hierarchy and wraps plate carree columns', () => {
  assert.equal(
    legacyTileSourceUrl('/tiles/', tileSourceById('mapnik'), { x: 7, y: 2, z: 0 }),
    '/tiles/mapnik/0/tile_2_1.png'
  );
  assert.equal(
    legacyTileSourceUrl('/tiles', tileSourceById('mapnik'), { x: 4, y: 9, z: 7 }),
    '/tiles/mapnik/7/9/tile_9_4.png'
  );
  assert.equal(
    legacyTileSourceUrl('/tiles', tileSourceById('physical'), { x: 2, y: 1, z: 3 }),
    '/tiles/relief.new/6/1/26.jpg'
  );
  assert.equal(
    legacyTileSourceUrl('/tiles', tileSourceById('satellite'), { x: 2, y: 1, z: 3 }),
    '/tiles/mapnik/sat/3/1/1_2.png'
  );
});

test('applies the legacy 180 degree offset only to shifted raster sources', () => {
  const tile = { x: 1, y: 2, z: 0 };
  assert.equal(
    legacyTileSourceUrl('/tiles', tileSourceById('physical'), tile),
    '/tiles/relief.new/3/2/4.jpg'
  );
  assert.equal(
    legacyTileSourceUrl('/tiles', tileSourceById('blue-marble'), tile),
    '/tiles/blue_marble/3/2/4.jpg'
  );
  assert.equal(
    legacyTileSourceUrl('/tiles', tileSourceById('night'), tile),
    '/tiles/black_marble/3/2/4.jpg'
  );
  assert.equal(
    legacyTileSourceUrl('/tiles', tileSourceById('coastline'), tile),
    '/tiles/plain/0/tile_2_1.png'
  );
});

test('label catalog includes legacy languages and Chinese variants', () => {
  const languages = new Map(LABEL_LANGUAGES);
  assert.equal(languages.get('en'), 'English');
  assert.equal(languages.get('de'), 'Deutsch');
  assert.ok(languages.has('zh-hant'));
  assert.ok(LABEL_LANGUAGES.length > 80);
});

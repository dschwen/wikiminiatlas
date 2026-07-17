import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CELESTIAL_BODIES,
  celestialBodyById,
  LABEL_LANGUAGES,
  legacyTileSourceUrl,
  TILE_SOURCES,
  tileSourceById
} from './catalog.mjs';

test('catalog retains the six legacy Earth raster layers', () => {
  assert.deepEqual(TILE_SOURCES.map((source) => source.id), [
    'mapnik', 'physical', 'satellite', 'coastline', 'blue-marble', 'night'
  ]);
  assert.equal(tileSourceById('mapnik').jsonFromZoom, 13);
  assert.equal(tileSourceById('mapnik').maximumZoom, 20);
  assert.equal(tileSourceById('mapnik').minimumCameraAltitude, 0.0000625);
  assert.equal(tileSourceById('physical').jsonFromZoom, undefined);
  assert.equal(tileSourceById('missing').id, 'mapnik');
});

test('catalog retains every legacy celestial body and its physical metadata', () => {
  assert.deepEqual(CELESTIAL_BODIES.map((body) => body.id), [
    'earth', 'moon', 'mars', 'venus', 'mercury', 'io', 'titan'
  ]);
  assert.equal(celestialBodyById('MOON').equatorialCircumferenceKm, 10940.475);
  assert.equal(celestialBodyById('mars').labelDataset, 'mars');
  assert.equal(celestialBodyById('missing').id, 'earth');
  assert.deepEqual(celestialBodyById('moon').sources.map((source) => source.id), [
    'lro', 'satellite'
  ]);
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

test('builds legacy celestial-body paths with their body-specific offsets', () => {
  const url = (bodyId, sourceId, tile) => legacyTileSourceUrl(
    '/tiles',
    tileSourceById(sourceId, celestialBodyById(bodyId)),
    tile
  );
  assert.equal(
    url('moon', 'lro', { x: 1, y: 2, z: 0 }),
    '/tiles/lro_moon/lromoon_005_001_002.png'
  );
  assert.equal(
    url('moon', 'satellite', { x: 1, y: 2, z: 0 }),
    '/tiles/moon.new/3/2/4.jpg'
  );
  assert.equal(
    url('mars', 'satellite', { x: 1, y: 2, z: 0 }),
    '/tiles/mars/mars_005_004_002.png'
  );
  assert.equal(
    url('venus', 'physical', { x: 1, y: 2, z: 0 }),
    '/tiles/venus/venus_003_001_002.png'
  );
  assert.equal(
    url('mercury', 'satellite', { x: 15, y: 10, z: 6 }),
    '/tiles/mercury/0/2/merc_000_207_010.png'
  );
  assert.equal(
    url('io', 'satellite', { x: 1, y: 2, z: 0 }),
    '/tiles/io/io_004_004_002.png'
  );
  assert.equal(
    url('titan', 'satellite', { x: 1, y: 2, z: 0 }),
    '/tiles/titan/titan_003_001_002.png'
  );
});

test('label catalog includes legacy languages and Chinese variants', () => {
  const languages = new Map(LABEL_LANGUAGES);
  assert.equal(languages.get('en'), 'English');
  assert.equal(languages.get('de'), 'Deutsch');
  assert.equal(languages.get('commons'), 'Commons');
  assert.ok(languages.has('zh-hant'));
  assert.ok(LABEL_LANGUAGES.length > 80);
});

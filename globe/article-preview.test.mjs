import test from 'node:test';
import assert from 'node:assert/strict';

import { wikipediaArticleFromUrl, wikipediaSummaryUrl } from './article-preview.mjs';

test('recognizes Wikipedia article links used by globe labels', () => {
  assert.deepEqual(
    wikipediaArticleFromUrl('https://de.wikipedia.org/wiki/Berlin'),
    { language: 'de', page: 'Berlin' }
  );
  assert.deepEqual(
    wikipediaArticleFromUrl('https://zh-hant.wikipedia.org/wiki/%E5%8F%B0%E7%81%A3'),
    { language: 'zh-hant', page: '%E5%8F%B0%E7%81%A3' }
  );
  assert.equal(wikipediaArticleFromUrl('https://commons.wikimedia.org/wiki/File:X.jpg'), null);
  assert.equal(wikipediaArticleFromUrl('not a url'), null);
});

test('builds the legacy REST summary endpoint', () => {
  assert.equal(
    wikipediaSummaryUrl({ language: 'en', page: 'Boise%2C_Idaho' }),
    'https://en.wikipedia.org/api/rest_v1/page/summary/Boise%2C_Idaho'
  );
});

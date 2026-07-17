import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchWiwosmGeoJson, wiwosmUrl } from './wiwosm-client.mjs';

test('constructs encoded WIWOSM article URLs', () => {
  assert.equal(
    wiwosmUrl('https://wiwosm.test/getGeoJSON.php?existing=1', {
      language: 'de', article: 'Köln am Rhein'
    }),
    'https://wiwosm.test/getGeoJSON.php?existing=1&lang=de&article=K%C3%B6ln+am+Rhein'
  );
});

test('fetches bounded WIWOSM JSON without credentials', async () => {
  const requests = [];
  const result = await fetchWiwosmGeoJson({
    base: 'https://wiwosm.test/get',
    language: 'en',
    article: 'Test',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => '{"type":"GeometryCollection","geometries":[]}'
      };
    }
  });
  assert.equal(result.type, 'GeometryCollection');
  assert.equal(requests[0].options.credentials, 'omit');
  assert.equal(requests[0].options.headers.Accept, 'application/json');
});

test('treats missing articles as empty and rejects oversized responses', async () => {
  assert.equal(await fetchWiwosmGeoJson({
    language: 'en', article: 'Missing',
    fetchImpl: async () => ({ ok: false, status: 404 })
  }), null);
  await assert.rejects(fetchWiwosmGeoJson({
    language: 'en', article: 'Large', maximumResponseBytes: 2,
    fetchImpl: async () => ({
      ok: true, status: 200,
      headers: { get: () => null },
      text: async () => '{} '
    })
  }), /too large/);
});

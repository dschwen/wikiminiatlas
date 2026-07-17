const DEFAULT_MAXIMUM_RESPONSE_BYTES = 4 * 1024 * 1024;

export function wiwosmUrl(base, { language, article }) {
  const url = new URL(base, typeof window === 'undefined'
    ? 'https://example.test/'
    : window.location.href);
  url.searchParams.set('lang', language);
  url.searchParams.set('article', article);
  return base.startsWith('/') && url.origin === 'https://example.test'
    ? `${url.pathname}${url.search}`
    : url.href;
}

export async function fetchWiwosmGeoJson({
  base = 'https://wiwosm.toolforge.org/osmjson/getGeoJSON.php',
  language,
  article,
  signal,
  fetchImpl = (...args) => fetch(...args),
  maximumResponseBytes = DEFAULT_MAXIMUM_RESPONSE_BYTES
}) {
  if (!language || !article) {
    throw new TypeError('WIWOSM language and article are required');
  }
  const response = await fetchImpl(wiwosmUrl(base, { language, article }), {
    signal,
    credentials: 'omit',
    headers: { Accept: 'application/json' }
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`WIWOSM request failed with HTTP ${response.status}`);
  }
  const declaredLength = Number(response.headers && response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumResponseBytes) {
    throw new RangeError('WIWOSM response is too large');
  }
  const text = await response.text();
  if (text.length > maximumResponseBytes) {
    throw new RangeError('WIWOSM response is too large');
  }
  return JSON.parse(text);
}

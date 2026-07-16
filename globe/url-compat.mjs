const FIELD_OF_VIEW_RADIANS = 42 * Math.PI / 180;

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function legacyCameraDistance({
  zoom,
  viewportHeight,
  fieldOfViewRadians = FIELD_OF_VIEW_RADIANS,
  baseColumns = 6,
  tileSize = 128
}) {
  const parsedZoom = finiteNumber(zoom);
  if (parsedZoom === null || parsedZoom < 0) {
    return null;
  }
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    throw new RangeError('viewportHeight must be a positive finite number');
  }
  const worldPixels = baseColumns * tileSize * 2 ** parsedZoom;
  const radiansPerPixel = 2 * Math.PI / worldPixels;
  const altitude = radiansPerPixel * viewportHeight /
    (2 * Math.tan(fieldOfViewRadians / 2));
  return Math.max(1.0005, Math.min(51, 1 + altitude));
}

function coordinateString(url, parameters) {
  const named = parameters.get('wma');
  if (named) {
    return named;
  }
  const query = url.search.slice(1);
  const firstPart = query.split('&', 1)[0];
  return firstPart && !firstPart.includes('=') ? firstPart : '';
}

export function parseGlobeUrl(input, { viewportHeight = 400 } = {}) {
  const url = input instanceof URL ? input : new URL(input, 'https://example.test');
  const parameters = url.searchParams;
  const legacyCoordinates = coordinateString(url, parameters);
  const fields = legacyCoordinates ? legacyCoordinates.split('_') : [];
  const legacy = fields.length >= 2 &&
    finiteNumber(fields[0]) !== null && finiteNumber(fields[1]) !== null;

  const markerLatitude = legacy ? finiteNumber(fields[0]) : finiteNumber(parameters.get('lat'));
  const markerLongitude = legacy ? finiteNumber(fields[1]) : finiteNumber(parameters.get('lon'));
  const legacyZoom = legacy && fields.length >= 6 ? finiteNumber(fields[5]) : null;
  const explicitCenter = legacy && fields.length >= 9 &&
    finiteNumber(fields[7]) !== null && finiteNumber(fields[8]) !== null;
  const labelLanguage = parameters.get('labelLang') ||
    (legacy && fields[4] ? fields[4] : (!legacy ? parameters.get('lang') : null)) ||
    'en';
  const explicitDistance = finiteNumber(parameters.get('distance'));

  return {
    legacy,
    legacyCoordinateString: legacyCoordinates,
    marker: {
      latitude: markerLatitude ?? 35,
      longitude: markerLongitude ?? -112
    },
    center: {
      latitude: explicitCenter ? Number(fields[7]) : markerLatitude ?? 35,
      longitude: explicitCenter ? Number(fields[8]) : markerLongitude ?? -112
    },
    distance: explicitDistance !== null && explicitDistance > 1
      ? Math.max(1.0005, Math.min(51, explicitDistance))
      : legacyZoom !== null
        ? legacyCameraDistance({ zoom: legacyZoom, viewportHeight })
        : 3.1,
    legacyZoom,
    requestedWidth: legacy && fields[2] ? finiteNumber(fields[2]) : null,
    requestedHeight: legacy && fields[3] ? finiteNumber(fields[3]) : null,
    labelLanguage,
    uiLanguage: legacy && fields[6] ? fields[6] : parameters.get('uiLang') || labelLanguage,
    globe: parameters.get('globe') || 'earth',
    tileSet: parameters.get('tileSet'),
    labelsEnabled: parameters.get('labels') !== '0',
    realisticLighting: parameters.get('lighting') === 'realistic',
    articleLanguage: parameters.get('lang') || (legacy && fields[4] ? fields[4] : 'en'),
    articlePage: parameters.get('page') || '',
    alwaysTooltips: parameters.get('awt') === '1'
  };
}

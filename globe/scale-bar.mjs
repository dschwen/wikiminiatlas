const KILOMETERS_TO_MILES = 0.621371192237334;

function assertPositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}

function conciseNumber(value) {
  if (value >= 1) {
    return Number(value.toPrecision(12)).toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 2
    });
  }
  return Number(value.toPrecision(2)).toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: 4
  });
}

export function selectNiceScale(unitsPerPixel, targetPixels = 50) {
  assertPositive(unitsPerPixel, 'unitsPerPixel');
  assertPositive(targetPixels, 'targetPixels');

  const unitsAtTarget = unitsPerPixel * targetPixels;
  let value = 10 ** Math.floor(Math.log10(unitsAtTarget));
  let pixels = value / unitsPerPixel;

  // Preserve the legacy WikiMiniAtlas 1/2/5 × 10^n selection order.
  if (pixels * 5 < targetPixels) {
    value *= 5;
    pixels *= 5;
  }
  if (pixels * 2 < targetPixels) {
    value *= 2;
    pixels *= 2;
  }

  return { value, pixels };
}

export function scaleBarsForCenter({
  centerRadiansPerPixel,
  equatorialCircumferenceKm,
  targetPixels = 50
}) {
  assertPositive(centerRadiansPerPixel, 'centerRadiansPerPixel');
  assertPositive(equatorialCircumferenceKm, 'equatorialCircumferenceKm');
  const radiusKm = equatorialCircumferenceKm / (2 * Math.PI);
  const kilometersPerPixel = radiusKm * centerRadiansPerPixel;
  const metric = selectNiceScale(kilometersPerPixel, targetPixels);
  const imperial = selectNiceScale(
    kilometersPerPixel * KILOMETERS_TO_MILES,
    targetPixels
  );

  return {
    kilometersPerPixel,
    metric: {
      ...metric,
      label: metric.value < 1
        ? `${conciseNumber(metric.value * 1000)} m`
        : `${conciseNumber(metric.value)} km`
    },
    imperial: {
      ...imperial,
      label: `${conciseNumber(imperial.value)} mi`
    }
  };
}

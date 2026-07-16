import { lonLatToUnitSphere } from './plate-carree-grid.mjs';
import { subsolarPointAt as earthSubsolarPointAt } from './solar-position.mjs';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const JULIAN_DATE_UNIX_EPOCH = 2440587.5;
const JULIAN_DATE_J2000 = 2451545.0;
const MILLISECONDS_PER_DAY = 86400000;
const DAYS_PER_CENTURY = 36525;
const ASTRONOMICAL_UNIT_KM = 149597870.7;
const J2000_OBLIQUITY = 23.43928 * DEG_TO_RAD;

// JPL's compact, fitted Keplerian elements for 1800-2050. These are small
// enough to ship with the application and are substantially more accurate
// than the globe's lighting requires. Values are base and rate per century:
// a, e, I, mean longitude, longitude of perihelion, longitude of node.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html
const PLANETARY_ELEMENTS = Object.freeze({
  mercury: [
    [0.38709927, 0.00000037], [0.20563593, 0.00001906],
    [7.00497902, -0.00594749], [252.25032350, 149472.67411175],
    [77.45779628, 0.16047689], [48.33076593, -0.12534081]
  ],
  venus: [
    [0.72333566, 0.00000390], [0.00677672, -0.00004107],
    [3.39467605, -0.00078890], [181.97909950, 58517.81538729],
    [131.60246718, 0.00268329], [76.67984255, -0.27769418]
  ],
  emb: [
    [1.00000261, 0.00000562], [0.01671123, -0.00004392],
    [-0.00001531, -0.01294668], [100.46457166, 35999.37244981],
    [102.93768193, 0.32327364], [0, 0]
  ],
  mars: [
    [1.52371034, 0.00001847], [0.09339410, 0.00007882],
    [1.84969142, -0.00813131], [-4.55343205, 19140.30268499],
    [-23.94362959, 0.44441088], [49.55953891, -0.29257343]
  ],
  jupiter: [
    [5.20288700, -0.00011607], [0.04838624, -0.00013253],
    [1.30439695, -0.00183714], [34.39644051, 3034.74612775],
    [14.72847983, 0.21252668], [100.47390909, 0.20469106]
  ],
  saturn: [
    [9.53667594, -0.00125060], [0.05386179, -0.00050991],
    [2.48599187, 0.00193609], [49.95424423, 1222.49362201],
    [92.59887831, -0.41897216], [113.66242448, -0.28867794]
  ]
});

const ORBIT_FOR_BODY = Object.freeze({
  moon: 'emb',
  mercury: 'mercury',
  venus: 'venus',
  mars: 'mars',
  io: 'jupiter',
  titan: 'saturn'
});

// The existing planetary label/tile datasets follow the IAU cartographic
// convention used by Horizons: direct-rotation bodies use west-positive
// longitudes, while Earth, the Moon, and Venus use east-positive longitudes.
const WEST_POSITIVE_BODIES = new Set(['mercury', 'mars', 'io', 'titan']);

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function signedDegrees(value) {
  const normalized = normalizeDegrees(value);
  return normalized >= 180 ? normalized - 360 : normalized;
}

function timestampFor(date) {
  const timestamp = date instanceof Date ? date.getTime() : Number(date);
  if (!Number.isFinite(timestamp)) {
    throw new TypeError('solar position requires a valid date or timestamp');
  }
  return timestamp;
}

function timeAt(date) {
  const julianDate = timestampFor(date) / MILLISECONDS_PER_DAY +
    JULIAN_DATE_UNIX_EPOCH;
  const days = julianDate - JULIAN_DATE_J2000;
  return { julianDate, days, centuries: days / DAYS_PER_CENTURY };
}

function sinDegrees(value) {
  return Math.sin(value * DEG_TO_RAD);
}

function cosDegrees(value) {
  return Math.cos(value * DEG_TO_RAD);
}

function solveEccentricAnomaly(meanAnomalyDegrees, eccentricity) {
  const meanAnomaly = signedDegrees(meanAnomalyDegrees) * DEG_TO_RAD;
  let eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly);
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const delta = (meanAnomaly - eccentricAnomaly +
      eccentricity * Math.sin(eccentricAnomaly)) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly += delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  return eccentricAnomaly;
}

function heliocentricEclipticPosition(orbit, centuries) {
  const elements = PLANETARY_ELEMENTS[orbit];
  if (!elements) throw new RangeError(`unsupported planetary orbit: ${orbit}`);
  const [a, e, inclination, meanLongitude, perihelion, node] =
    elements.map(([base, rate]) => base + rate * centuries);
  const argumentOfPerihelion = (perihelion - node) * DEG_TO_RAD;
  const eccentricAnomaly = solveEccentricAnomaly(meanLongitude - perihelion, e);
  const orbitalX = a * (Math.cos(eccentricAnomaly) - e);
  const orbitalY = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
  const cosArgument = Math.cos(argumentOfPerihelion);
  const sinArgument = Math.sin(argumentOfPerihelion);
  const cosNode = cosDegrees(node);
  const sinNode = sinDegrees(node);
  const cosInclination = cosDegrees(inclination);
  const sinInclination = sinDegrees(inclination);

  return [
    (cosArgument * cosNode - sinArgument * sinNode * cosInclination) * orbitalX +
      (-sinArgument * cosNode - cosArgument * sinNode * cosInclination) * orbitalY,
    (cosArgument * sinNode + sinArgument * cosNode * cosInclination) * orbitalX +
      (-sinArgument * sinNode + cosArgument * cosNode * cosInclination) * orbitalY,
    sinArgument * sinInclination * orbitalX +
      cosArgument * sinInclination * orbitalY
  ];
}

// A short lunar series is sufficient here: even a 1-degree error in the
// geocentric Moon vector changes the Moon-to-Sun direction by only about
// 0.003 degrees. Angles follow the compact Meeus-derived series historically
// used by WikiMiniAtlas, but this implementation is pure and side-effect free.
function lunarGeocentricEclipticPosition(days, centuries) {
  const solarMeanAnomaly = normalizeDegrees(
    357.529 + 35999 * centuries - 0.0001536 * centuries ** 2
  );
  const argumentOfLatitude = normalizeDegrees(
    93.2721 + 483202 * centuries - 0.003403 * centuries ** 2
  );
  const meanLongitude = normalizeDegrees(218.316 + 481268 * centuries);
  const lunarMeanAnomaly = normalizeDegrees(
    134.963 + 477199 * centuries + 0.008997 * centuries ** 2
  );
  const meanElongation = normalizeDegrees(
    297.85 + 445267 * centuries - 0.00163 * centuries ** 2
  );
  const twiceElongation = 2 * meanElongation;
  const latitude =
    5.128 * sinDegrees(argumentOfLatitude) +
    0.2806 * sinDegrees(lunarMeanAnomaly + argumentOfLatitude) +
    0.2777 * sinDegrees(lunarMeanAnomaly - argumentOfLatitude) +
    0.1732 * sinDegrees(twiceElongation - argumentOfLatitude);
  const longitude = meanLongitude +
    6.289 * sinDegrees(lunarMeanAnomaly) +
    1.274 * sinDegrees(twiceElongation - lunarMeanAnomaly) +
    0.6583 * sinDegrees(twiceElongation) +
    0.2136 * sinDegrees(2 * lunarMeanAnomaly) -
    0.1851 * sinDegrees(solarMeanAnomaly) -
    0.1143 * sinDegrees(2 * argumentOfLatitude) +
    0.0588 * sinDegrees(twiceElongation - 2 * lunarMeanAnomaly) +
    0.0572 * sinDegrees(twiceElongation - solarMeanAnomaly - lunarMeanAnomaly) +
    0.0533 * sinDegrees(twiceElongation + lunarMeanAnomaly);
  const distanceKm = 385000 -
    20954 * cosDegrees(lunarMeanAnomaly) -
    3699 * cosDegrees(twiceElongation - lunarMeanAnomaly) -
    2956 * cosDegrees(twiceElongation);
  const distanceAu = distanceKm / ASTRONOMICAL_UNIT_KM;
  const cosLatitude = cosDegrees(latitude);
  return [
    distanceAu * cosLatitude * cosDegrees(longitude),
    distanceAu * cosLatitude * sinDegrees(longitude),
    distanceAu * sinDegrees(latitude)
  ];
}

function eclipticToEquatorial([x, y, z]) {
  const cosObliquity = Math.cos(J2000_OBLIQUITY);
  const sinObliquity = Math.sin(J2000_OBLIQUITY);
  return [
    x,
    cosObliquity * y - sinObliquity * z,
    sinObliquity * y + cosObliquity * z
  ];
}

function periodicAngles(pairs, centuries) {
  return pairs.map(([base, rate, quadratic = 0]) =>
    base + rate * centuries + quadratic * centuries ** 2
  );
}

function applyPeriodic(base, coefficients, angles, trig) {
  return coefficients.reduce(
    (value, coefficient, index) => value + coefficient * trig(angles[index]),
    base
  );
}

const LUNAR_ANGLES = Object.freeze([
  [125.045, -1935.5364525], [250.089, -3871.072905],
  [260.008, 475263.3328725], [176.625, 487269.629985],
  [357.529, 35999.0509575], [311.589, 964468.49931],
  [134.963, 477198.869325], [276.617, 12006.300765],
  [34.226, 63863.5132425], [15.134, -5806.6093575],
  [119.743, 131.84064], [239.961, 6003.1503825],
  [25.053, 473327.79642]
]);

const MARS_ANGLES = Object.freeze([
  [190.72646643, 15917.10818695], [21.46892470, 31834.27934054],
  [332.86082793, 19139.89694742], [394.93256437, 38280.79631835],
  [189.63271560, 41215158.18420050, 12.711923222],
  [121.46893664, 660.22803474], [231.05028581, 660.99123540],
  [251.37314025, 1320.50145245], [217.98635955, 38279.96125550],
  [196.19729402, 19139.83628608], [198.991226, 19139.4819985],
  [226.292679, 38280.8511281], [249.663391, 57420.7251593],
  [266.183510, 76560.6367950], [79.398797, 0.5042615],
  [122.433576, 19139.9407476], [43.058401, 38280.8753272],
  [57.663379, 57420.7517205], [79.476401, 76560.6495004],
  [166.325722, 0.5042615], [129.071773, 19140.0328244],
  [36.352167, 38281.0473591], [56.668646, 57420.9295360],
  [67.364003, 76560.2552215], [104.792680, 95700.4387578],
  [95.391654, 0.5042615]
]);

function orientationForBody(bodyId, { days, centuries }) {
  if (bodyId === 'moon') {
    const angles = periodicAngles(LUNAR_ANGLES, centuries);
    return {
      rightAscension: applyPeriodic(
        269.9949 + 0.0031 * centuries,
        [-3.8787, -0.1204, 0.0700, -0.0172, 0, 0.0072, 0, 0, 0, -0.0052, 0, 0, 0.0043],
        angles,
        sinDegrees
      ),
      declination: applyPeriodic(
        66.5392 + 0.0130 * centuries,
        [1.5419, 0.0239, -0.0278, 0.0068, 0, -0.0029, 0.0009, 0, 0, 0.0008, 0, 0, -0.0009],
        angles,
        cosDegrees
      ),
      primeMeridian: applyPeriodic(
        38.3213 + 13.17635815 * days - 1.4e-12 * days ** 2,
        [3.5610, 0.1208, -0.0642, 0.0158, 0.0252, -0.0066, -0.0047,
          -0.0046, 0.0028, 0.0052, 0.0040, 0.0019, -0.0044],
        angles,
        sinDegrees
      )
    };
  }
  if (bodyId === 'mercury') {
    const angles = periodicAngles([
      [174.7910857, 149472.535875], [349.5821714, 298945.07175],
      [164.3732571, 448417.607625], [339.1643429, 597890.1435],
      [153.9554286, 747362.679375]
    ], centuries);
    return {
      rightAscension: 281.0103 - 0.0328 * centuries,
      declination: 61.4155 - 0.0049 * centuries,
      primeMeridian: applyPeriodic(
        329.5988 + 6.1385108 * days,
        [0.01067257, -0.00112309, -0.00011040, -0.00002539, -0.00000571],
        angles,
        sinDegrees
      )
    };
  }
  if (bodyId === 'venus') {
    return {
      rightAscension: 272.76,
      declination: 67.16,
      primeMeridian: 160.20 - 1.4813688 * days
    };
  }
  if (bodyId === 'mars') {
    const angles = periodicAngles(MARS_ANGLES, centuries);
    const raCoefficients = Array(10).fill(0).concat(
      [0.000068, 0.000238, 0.000052, 0.000009, 0.419057]
    );
    const decCoefficients = Array(15).fill(0).concat(
      [0.000051, 0.000141, 0.000031, 0.000005, 1.591274]
    );
    const meridianCoefficients = Array(20).fill(0).concat(
      [0.000145, 0.000157, 0.000040, 0.000001, 0.000001, 0.584542]
    );
    return {
      rightAscension: applyPeriodic(
        317.269202 - 0.10927547 * centuries,
        raCoefficients,
        angles,
        sinDegrees
      ),
      declination: applyPeriodic(
        54.432516 - 0.05827105 * centuries,
        decCoefficients,
        angles,
        cosDegrees
      ),
      primeMeridian: applyPeriodic(
        176.049863 + 350.891982443297 * days,
        meridianCoefficients,
        angles,
        sinDegrees
      )
    };
  }
  if (bodyId === 'io') {
    const angles = periodicAngles([
      [73.32, 91472.9], [24.62, 45137.2], [283.90, 4850.7],
      [355.80, 1191.3]
    ], centuries);
    return {
      rightAscension: applyPeriodic(
        268.05 - 0.009 * centuries,
        [0, 0, 0.094, 0.024],
        angles,
        sinDegrees
      ),
      declination: applyPeriodic(
        64.50 + 0.003 * centuries,
        [0, 0, 0.040, 0.011],
        angles,
        cosDegrees
      ),
      primeMeridian: applyPeriodic(
        200.39 + 203.4889538 * days,
        [0, 0, -0.085, -0.022],
        angles,
        sinDegrees
      )
    };
  }
  if (bodyId === 'titan') {
    return {
      rightAscension: 39.4827,
      declination: 83.4279,
      primeMeridian: 186.5855 + 22.5769768 * days
    };
  }
  throw new RangeError(`unsupported solar orientation body: ${bodyId}`);
}

// SPICE's text-PCK inertial-to-body-fixed transform is
// [W]3 [90-DEC]1 [90+RA]3. These coordinate rotations use SPICE's
// sign convention and transform a vector rather than the frame itself.
function rotateZ([x, y, z], degrees) {
  const cosine = cosDegrees(degrees);
  const sine = sinDegrees(degrees);
  return [cosine * x + sine * y, -sine * x + cosine * y, z];
}

function rotateX([x, y, z], degrees) {
  const cosine = cosDegrees(degrees);
  const sine = sinDegrees(degrees);
  return [x, cosine * y + sine * z, -sine * y + cosine * z];
}

function inertialToBodyFixed(vector, orientation) {
  const first = rotateZ(vector, 90 + orientation.rightAscension);
  const second = rotateX(first, 90 - orientation.declination);
  return rotateZ(second, orientation.primeMeridian);
}

function normalizeVector(vector) {
  const length = Math.hypot(...vector);
  if (!Number.isFinite(length) || length === 0) {
    throw new RangeError('solar direction could not be normalized');
  }
  return vector.map((component) => component / length);
}

function inertialSunVectorForBody(bodyId, time) {
  const orbit = ORBIT_FOR_BODY[bodyId];
  if (!orbit) throw new RangeError(`unsupported solar direction body: ${bodyId}`);
  const target = heliocentricEclipticPosition(orbit, time.centuries);
  if (bodyId === 'moon') {
    const lunarOffset = lunarGeocentricEclipticPosition(time.days, time.centuries);
    target[0] += lunarOffset[0];
    target[1] += lunarOffset[1];
    target[2] += lunarOffset[2];
  }
  return eclipticToEquatorial(target.map((component) => -component));
}

export function subsolarPointForBody(bodyId, date = new Date()) {
  const normalizedBodyId = String(bodyId).toLowerCase();
  if (normalizedBodyId === 'earth') return earthSubsolarPointAt(date);
  const time = timeAt(date);
  const inertial = inertialSunVectorForBody(normalizedBodyId, time);
  const bodyFixed = normalizeVector(
    inertialToBodyFixed(inertial, orientationForBody(normalizedBodyId, time))
  );
  const rightHandedLongitude = Math.atan2(bodyFixed[1], bodyFixed[0]) * RAD_TO_DEG;
  return {
    longitude: signedDegrees(
      WEST_POSITIVE_BODIES.has(normalizedBodyId)
        ? -rightHandedLongitude
        : rightHandedLongitude
    ),
    latitude: Math.asin(bodyFixed[2]) * RAD_TO_DEG
  };
}

export function sunDirectionForBody(bodyId, date = new Date()) {
  const point = subsolarPointForBody(bodyId, date);
  return lonLatToUnitSphere(point.longitude, point.latitude);
}

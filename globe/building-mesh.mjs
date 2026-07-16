import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

const EARTH_RADIUS_METERS = 6378137;
const DEFAULT_MAXIMUM_TRIANGLES = 4000;

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseBuildingHeight(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  let match = /^(\d+(?:\.\d*)?)(?:\s*m)?$/i.exec(text);
  if (match) return Number(match[1]);
  match = /^(?:(\d+(?:\.\d*)?)')?\s*(?:(\d+(?:\.\d*)?)")?$/.exec(text);
  if (match && (match[1] || match[2])) {
    return Number(match[1] || 0) * 0.3048 + Number(match[2] || 0) * 0.0254;
  }
  return null;
}

function heightFromTags(tags) {
  const levels = parseNumber(tags['building:levels']);
  const minimumLevels = parseNumber(tags['building:min_level']);
  const explicitHeight = parseBuildingHeight(tags.height);
  const explicitMinimumHeight = parseBuildingHeight(tags.min_height);
  const height = explicitHeight && explicitHeight > 0
    ? explicitHeight
    : levels !== null ? levels * 3 : null;
  if (height === null || height <= 0) return null;
  const minimumHeight = Math.max(
    0,
    explicitMinimumHeight && explicitMinimumHeight > 0
      ? explicitMinimumHeight
      : minimumLevels !== null ? minimumLevels * 3 : 0
  );
  return {
    height: Math.min(2000, Math.max(height, minimumHeight)),
    minimumHeight: Math.min(2000, minimumHeight)
  };
}

function polygonParts(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.flatMap(polygonParts);
  }
  return [];
}

function unwrappedRing(ring, referenceLongitude = null) {
  const points = [];
  for (const coordinate of ring) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) continue;
    let longitude = coordinate[0];
    const latitude = coordinate[1];
    const reference = points.length
      ? points[points.length - 1][0]
      : referenceLongitude;
    if (reference !== null) {
      while (longitude - reference > 180) longitude -= 360;
      while (longitude - reference < -180) longitude += 360;
    }
    points.push([longitude, latitude]);
  }
  if (
    points.length > 1 &&
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1]
  ) {
    points.pop();
  }
  return points;
}

function centroid(ring) {
  if (ring.length === 0) return [0, 0];
  const total = ring.reduce(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
    [0, 0]
  );
  return [total[0] / ring.length, total[1] / ring.length];
}

function polygonBelongsToTile(rings, tile) {
  if (!rings[0] || rings[0].length < 3) return false;
  const span = 60 / 2 ** tile.z;
  let west = tile.x * span;
  while (west >= 180) west -= 360;
  while (west < -180) west += 360;
  const north = 90 - tile.y * span;
  const south = north - span;
  const outer = unwrappedRing(rings[0], west + span / 2);
  const [longitude, latitude] = centroid(outer);
  return longitude >= west && longitude < west + span &&
    latitude >= south && latitude <= north;
}

function surfacePoint([longitude, latitude], heightMeters, radiusMeters) {
  const radius = 1 + heightMeters / radiusMeters;
  return lonLatToUnitSphere(longitude, latitude).map((value) => value * radius);
}

function subtract(first, second) {
  return [first[0] - second[0], first[1] - second[1], first[2] - second[2]];
}

function cross(first, second) {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0]
  ];
}

function dot(first, second) {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

function normalize(vector) {
  const length = Math.hypot(...vector);
  return length > 0 ? vector.map((value) => value / length) : [0, 1, 0];
}

function ringArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const next = ring[(index + 1) % ring.length];
    area += ring[index][0] * next[1] - next[0] * ring[index][1];
  }
  return area / 2;
}

function pointInTriangle(point, first, second, third) {
  const sign = (p1, p2, p3) =>
    (p1[0] - p3[0]) * (p2[1] - p3[1]) -
    (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const firstSign = sign(point, first, second);
  const secondSign = sign(point, second, third);
  const thirdSign = sign(point, third, first);
  return !(firstSign < 0 || secondSign < 0 || thirdSign < 0) ||
    !(firstSign > 0 || secondSign > 0 || thirdSign > 0);
}

function earClip(ring) {
  if (ring.length < 3) return [];
  const points = ringArea(ring) > 0 ? ring : [...ring].reverse();
  const remaining = points.map((point, index) => index);
  const triangles = [];
  let guard = points.length * points.length;
  while (remaining.length > 3 && guard > 0) {
    guard -= 1;
    let clipped = false;
    for (let offset = 0; offset < remaining.length; offset += 1) {
      const previous = remaining[(offset - 1 + remaining.length) % remaining.length];
      const current = remaining[offset];
      const next = remaining[(offset + 1) % remaining.length];
      if (ringArea([points[previous], points[current], points[next]]) <= 0) continue;
      if (remaining.some((candidate) =>
        candidate !== previous && candidate !== current && candidate !== next &&
        pointInTriangle(points[candidate], points[previous], points[current], points[next])
      )) continue;
      triangles.push([points[previous], points[current], points[next]]);
      remaining.splice(offset, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (remaining.length === 3) {
    triangles.push(remaining.map((index) => points[index]));
  }
  return triangles;
}

function poly2triRoof(rings, triangulator) {
  if (!triangulator || !rings[0] || rings[0].length < 3) return null;
  try {
    const contour = rings[0].map(([x, y]) => new triangulator.Point(x, y));
    const context = new triangulator.SweepContext(contour);
    for (const ring of rings.slice(1)) {
      if (ring.length >= 3) {
        context.AddHole(ring.map(([x, y]) => new triangulator.Point(x, y)));
      }
    }
    triangulator.sweep.Triangulate(context);
    return context.GetTriangles().map((triangle) => [
      triangle.GetPoint(0), triangle.GetPoint(1), triangle.GetPoint(2)
    ].map((point) => [point.x, point.y]));
  } catch (error) {
    return null;
  }
}

function roofTriangles(rings, triangulator) {
  return poly2triRoof(rings, triangulator) || earClip(rings[0]);
}

function createMeshBuilder(maximumTriangles) {
  const positions = [];
  const normals = [];
  let truncated = false;
  const addTriangle = (first, second, third, outwardHint) => {
    if (positions.length / 9 >= maximumTriangles) {
      truncated = true;
      return false;
    }
    let b = second;
    let c = third;
    let normal = cross(subtract(b, first), subtract(c, first));
    if (dot(normal, outwardHint) < 0) {
      [b, c] = [c, b];
      normal = normal.map((value) => -value);
    }
    normal = normalize(normal);
    positions.push(...first, ...b, ...c);
    normals.push(...normal, ...normal, ...normal);
    return true;
  };
  return {
    addTriangle,
    finish(buildingCount) {
      return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        vertexCount: positions.length / 3,
        triangleCount: positions.length / 9,
        buildingCount,
        truncated
      };
    }
  };
}

function addWalls(builder, rings, bottom, top, radiusMeters) {
  for (let ringIndex = 0; ringIndex < rings.length; ringIndex += 1) {
    const ring = rings[ringIndex];
    const ringCenter = surfacePoint(centroid(ring), (bottom + top) / 2, radiusMeters);
    for (let index = 0; index < ring.length; index += 1) {
      const next = (index + 1) % ring.length;
      const firstBottom = surfacePoint(ring[index], bottom, radiusMeters);
      const nextBottom = surfacePoint(ring[next], bottom, radiusMeters);
      const firstTop = surfacePoint(ring[index], top, radiusMeters);
      const nextTop = surfacePoint(ring[next], top, radiusMeters);
      const midpoint = firstBottom.map((value, axis) =>
        (value + nextBottom[axis] + firstTop[axis] + nextTop[axis]) / 4
      );
      const outward = ringIndex === 0
        ? subtract(midpoint, ringCenter)
        : subtract(ringCenter, midpoint);
      if (!builder.addTriangle(firstBottom, nextBottom, firstTop, outward)) return false;
      if (!builder.addTriangle(firstTop, nextBottom, nextTop, outward)) return false;
    }
  }
  return true;
}

function addFlatRoof(builder, rings, height, radiusMeters, triangulator) {
  for (const triangle of roofTriangles(rings, triangulator)) {
    const points = triangle.map((point) => surfacePoint(point, height, radiusMeters));
    const outward = normalize(points.reduce(
      (sum, point) => sum.map((value, index) => value + point[index]),
      [0, 0, 0]
    ));
    if (!builder.addTriangle(points[0], points[1], points[2], outward)) return false;
  }
  return true;
}

function addPyramidalRoof(builder, ring, bottom, top, radiusMeters) {
  const apexCoordinate = centroid(ring);
  const apex = surfacePoint(apexCoordinate, top, radiusMeters);
  const center = surfacePoint(apexCoordinate, bottom, radiusMeters);
  for (let index = 0; index < ring.length; index += 1) {
    const next = (index + 1) % ring.length;
    const first = surfacePoint(ring[index], bottom, radiusMeters);
    const second = surfacePoint(ring[next], bottom, radiusMeters);
    const midpoint = first.map((value, axis) => (value + second[axis] + apex[axis]) / 3);
    if (!builder.addTriangle(first, second, apex, subtract(midpoint, center))) return false;
  }
  return true;
}

function addGabledRoof(builder, ring, bottom, top, radiusMeters) {
  if (ring.length !== 4) return false;
  const lengths = ring.map((point, index) => {
    const next = ring[(index + 1) % ring.length];
    return Math.hypot(next[0] - point[0], next[1] - point[1]);
  });
  const start = lengths[0] + lengths[2] > lengths[1] + lengths[3] ? 0 : 1;
  const firstRidge = [
    (ring[start][0] + ring[(start + 3) % 4][0]) / 2,
    (ring[start][1] + ring[(start + 3) % 4][1]) / 2
  ];
  const secondRidge = [
    (ring[(start + 1) % 4][0] + ring[(start + 2) % 4][0]) / 2,
    (ring[(start + 1) % 4][1] + ring[(start + 2) % 4][1]) / 2
  ];
  const ridge = [
    surfacePoint(firstRidge, top, radiusMeters),
    surfacePoint(secondRidge, top, radiusMeters)
  ];
  const center = surfacePoint(centroid(ring), bottom, radiusMeters);
  const side = (firstIndex, secondIndex, firstTop, secondTop) => {
    const first = surfacePoint(ring[firstIndex], bottom, radiusMeters);
    const second = surfacePoint(ring[secondIndex], bottom, radiusMeters);
    const outward = subtract(first.map((value, axis) =>
      (value + second[axis] + firstTop[axis] + secondTop[axis]) / 4
    ), center);
    return builder.addTriangle(first, second, firstTop, outward) &&
      builder.addTriangle(firstTop, second, secondTop, outward);
  };
  if (!side(start, (start + 1) % 4, ridge[0], ridge[1])) return false;
  if (!side((start + 2) % 4, (start + 3) % 4, ridge[1], ridge[0])) return false;
  const firstGable = surfacePoint(ring[(start + 3) % 4], bottom, radiusMeters);
  const firstGableNext = surfacePoint(ring[start], bottom, radiusMeters);
  const secondGable = surfacePoint(ring[(start + 1) % 4], bottom, radiusMeters);
  const secondGableNext = surfacePoint(ring[(start + 2) % 4], bottom, radiusMeters);
  return builder.addTriangle(firstGable, firstGableNext, ridge[0], subtract(firstGable, center)) &&
    builder.addTriangle(secondGable, secondGableNext, ridge[1], subtract(secondGable, center));
}

export function buildBuildingMesh(tileData, {
  radiusMeters = EARTH_RADIUS_METERS,
  maximumTriangles = DEFAULT_MAXIMUM_TRIANGLES,
  triangulator = typeof globalThis === 'undefined' ? null : globalThis.p2t
} = {}) {
  const builder = createMeshBuilder(maximumTriangles);
  let buildingCount = 0;
  for (const feature of tileData.data) {
    if (!('building' in feature.tags) && !('building:part' in feature.tags)) continue;
    const heights = heightFromTags(feature.tags);
    if (!heights || heights.height <= heights.minimumHeight) continue;
    for (const polygon of polygonParts(feature.geo)) {
      if (!polygonBelongsToTile(polygon, tileData)) continue;
      const firstRing = unwrappedRing(polygon[0]);
      if (firstRing.length < 3) continue;
      const rings = [firstRing, ...polygon.slice(1).map((ring) =>
        unwrappedRing(ring, firstRing[0][0])
      )].filter((ring) => ring.length >= 3);
      const roofShape = feature.tags['roof:shape'] || feature.tags['building:roof:shape'];
      const roofHeight = Math.max(0, parseBuildingHeight(
        feature.tags['roof:height'] || feature.tags['building:roof:height']
      ) || 0);
      const buildingPyramid = feature.tags['building:shape'] === 'pyramid';
      const pyramidal = buildingPyramid ||
        (roofShape === 'pyramidal' && roofHeight > 0);
      const gabled = (roofShape === 'gabled' || roofShape === 'hilted') &&
        roofHeight > 0;
      const roofBottom = buildingPyramid
        ? heights.minimumHeight
        : pyramidal || gabled
          ? Math.max(heights.minimumHeight, heights.height - roofHeight)
          : heights.height;
      if (roofBottom > heights.minimumHeight &&
          !addWalls(builder, rings, heights.minimumHeight, roofBottom, radiusMeters)) {
        return builder.finish(buildingCount);
      }
      let complete;
      if (pyramidal) {
        complete = addPyramidalRoof(
          builder, rings[0], roofBottom, heights.height, radiusMeters
        );
      } else if (gabled && rings.length === 1 && rings[0].length === 4) {
        complete = addGabledRoof(
          builder, rings[0], roofBottom, heights.height, radiusMeters
        );
      } else {
        if (roofBottom === heights.minimumHeight) {
          complete = addWalls(
            builder, rings, heights.minimumHeight, heights.height, radiusMeters
          );
        }
        complete = complete !== false && addFlatRoof(
          builder, rings, heights.height, radiusMeters, triangulator
        );
      }
      buildingCount += 1;
      if (!complete) return builder.finish(buildingCount);
    }
  }
  return builder.finish(buildingCount);
}

import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

const DEG_TO_RAD = Math.PI / 180;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return vector.map((component) => component / length);
}

class MaxHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(item) {
    let index = this.items.push(item) - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].priority >= item.priority) {
        break;
      }
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = item;
  }

  pop() {
    if (this.items.length === 0) {
      return null;
    }
    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length === 0) {
      return first;
    }

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.items.length) {
        break;
      }
      const child = right < this.items.length &&
        this.items[right].priority > this.items[left].priority
        ? right
        : left;
      if (this.items[child].priority <= last.priority) {
        break;
      }
      this.items[index] = this.items[child];
      index = child;
    }
    this.items[index] = last;
    return first;
  }
}

function tileKey(tile) {
  return `${tile.z}/${tile.x}/${tile.y}`;
}

/**
 * Select visible plate carrée patches while enforcing a hard leaf budget.
 * The largest projected-error leaf is refined first, concentrating detail
 * where it contributes the most screen pixels.
 */
export function selectVisibleTiles({
  grid,
  maximumZoom,
  eyeDirection,
  distance,
  viewportWidth,
  viewportHeight,
  fieldOfViewRadians,
  desiredTilePixels,
  maximumLeafTiles = 256
}) {
  const rootDimensions = grid.dimensions(0);
  const rootTileCount = rootDimensions.columns * rootDimensions.rows;
  if (!Number.isInteger(maximumLeafTiles) || maximumLeafTiles < rootTileCount) {
    throw new RangeError(`maximumLeafTiles must be at least ${rootTileCount}`);
  }

  const aspect = viewportWidth / viewportHeight;
  const tangent = Math.tan(fieldOfViewRadians / 2);
  const right = normalize(cross([0, 1, 0], eyeDirection));
  const up = cross(eyeDirection, right);
  const eye = eyeDirection.map((component) => component * distance);
  const horizonAngle = Math.acos(1 / distance);
  const near = Math.max(0.00005, (distance - 1) * 0.1);
  const far = distance + 1.1;
  const leaves = new Map();
  const candidates = new MaxHeap();
  let visitedNodes = 0;
  let budgetLimited = false;

  const projectedTileSize = (bounds) => {
    const longitudes = [bounds.west, (bounds.west + bounds.east) / 2, bounds.east];
    const latitudes = [bounds.south, (bounds.south + bounds.north) / 2, bounds.north];
    let minimumX = Infinity;
    let maximumX = -Infinity;
    let minimumY = Infinity;
    let maximumY = -Infinity;

    for (const longitude of longitudes) {
      for (const latitude of latitudes) {
        const point = lonLatToUnitSphere(longitude, latitude);
        const relative = [
          point[0] - eye[0],
          point[1] - eye[1],
          point[2] - eye[2]
        ];
        const depth = -dot(relative, eyeDirection);
        if (depth <= 0) {
          continue;
        }
        const screenX = dot(relative, right) / (depth * tangent * aspect) *
          viewportWidth / 2;
        const screenY = dot(relative, up) / (depth * tangent) *
          viewportHeight / 2;
        minimumX = Math.min(minimumX, screenX);
        maximumX = Math.max(maximumX, screenX);
        minimumY = Math.min(minimumY, screenY);
        maximumY = Math.max(maximumY, screenY);
      }
    }

    return Math.max(maximumX - minimumX, maximumY - minimumY);
  };

  const evaluate = (x, y, z) => {
    visitedNodes += 1;
    const bounds = grid.tileBounds(x, y, z);
    const center = lonLatToUnitSphere(
      (bounds.west + bounds.east) / 2,
      (bounds.south + bounds.north) / 2
    );
    const angularRadius = Math.min(
      Math.PI,
      grid.angularTileSize(z) * DEG_TO_RAD * Math.SQRT2 * 0.55
    );
    const centerAngle = Math.acos(clamp(dot(center, eyeDirection), -1, 1));
    if (centerAngle > horizonAngle + angularRadius) {
      return null;
    }

    const boundingRadius = 2 * Math.sin(angularRadius / 2);
    const relative = [
      center[0] - eye[0],
      center[1] - eye[1],
      center[2] - eye[2]
    ];
    const cameraX = dot(relative, right);
    const cameraY = dot(relative, up);
    const depth = -dot(relative, eyeDirection);
    const halfHeight = depth * tangent;
    const halfWidth = halfHeight * aspect;
    if (
      depth + boundingRadius < near ||
      depth - boundingRadius > far ||
      Math.abs(cameraX) > halfWidth + boundingRadius ||
      Math.abs(cameraY) > halfHeight + boundingRadius
    ) {
      return null;
    }

    const projectedPixels = projectedTileSize(bounds);
    return {
      x,
      y,
      z,
      bounds,
      projectedPixels,
      priority: projectedPixels / desiredTilePixels
    };
  };

  const addLeaf = (tile) => {
    leaves.set(tileKey(tile), tile);
    if (tile.z < maximumZoom && tile.projectedPixels > desiredTilePixels) {
      candidates.push(tile);
    }
  };

  for (let y = 0; y < rootDimensions.rows; y += 1) {
    for (let x = 0; x < rootDimensions.columns; x += 1) {
      const root = evaluate(x, y, 0);
      if (root) {
        addLeaf(root);
      }
    }
  }

  while (candidates.size > 0) {
    const parent = candidates.pop();
    const parentKey = tileKey(parent);
    if (!leaves.has(parentKey)) {
      continue;
    }

    const childX = parent.x * 2;
    const childY = parent.y * 2;
    const childZoom = parent.z + 1;
    const children = [
      evaluate(childX, childY, childZoom),
      evaluate(childX + 1, childY, childZoom),
      evaluate(childX, childY + 1, childZoom),
      evaluate(childX + 1, childY + 1, childZoom)
    ].filter(Boolean);

    if (leaves.size - 1 + children.length > maximumLeafTiles) {
      budgetLimited = true;
      continue;
    }

    leaves.delete(parentKey);
    for (const child of children) {
      addLeaf(child);
    }
  }

  const tiles = [...leaves.values()];
  return {
    tiles,
    visitedNodes,
    budgetLimited,
    minimumZoom: Math.min(...tiles.map((tile) => tile.z)),
    maximumZoom: Math.max(...tiles.map((tile) => tile.z))
  };
}

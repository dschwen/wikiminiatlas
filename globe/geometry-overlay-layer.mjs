import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

const DEG_TO_RAD = Math.PI / 180;

function dot(first, second) {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length === 0) return [0, 0, 0];
  return vector.map((component) => component / length);
}

function cross(first, second) {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0]
  ];
}

function slerp(first, second, amount) {
  const cosine = Math.max(-1, Math.min(1, dot(first, second)));
  const angle = Math.acos(cosine);
  if (angle < 1e-8) return first.slice();
  const sine = Math.sin(angle);
  if (Math.abs(sine) < 1e-8) {
    return normalize(first.map((component, index) =>
      component * (1 - amount) + second[index] * amount
    ));
  }
  const firstWeight = Math.sin((1 - amount) * angle) / sine;
  const secondWeight = Math.sin(amount * angle) / sine;
  return first.map((component, index) =>
    component * firstWeight + second[index] * secondWeight
  );
}

function segmentIntersection(first, second, eyeDirection, horizon) {
  let low = 0;
  let high = 1;
  const firstInside = dot(first, eyeDirection) > horizon;
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const middle = (low + high) / 2;
    const inside = dot(slerp(first, second, middle), eyeDirection) > horizon;
    if (inside === firstInside) low = middle;
    else high = middle;
  }
  return slerp(first, second, (low + high) / 2);
}

function densifyUnits(units, maximumStepRadians, closed = false) {
  if (units.length === 0) return [];
  const result = [units[0]];
  const segmentCount = closed ? units.length : units.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const first = units[index];
    const second = units[(index + 1) % units.length];
    const angle = Math.acos(Math.max(-1, Math.min(1, dot(first, second))));
    const steps = Math.min(64, Math.max(1, Math.ceil(angle / maximumStepRadians)));
    for (let step = 1; step <= steps; step += 1) {
      if (closed && index === segmentCount - 1 && step === steps) continue;
      result.push(slerp(first, second, step / steps));
    }
  }
  return result;
}

function prepareGeometry(geometry) {
  if (!geometry) return null;
  const preparePath = (path) => path.map((point) =>
    lonLatToUnitSphere(point.longitude, point.latitude)
  );
  return {
    lines: geometry.lines.map(preparePath),
    polygons: geometry.polygons.map((polygon) => ({
      outer: polygon.outer.map(preparePath),
      holes: polygon.holes.map(preparePath)
    }))
  };
}

function horizonArc(first, second, eyeDirection, horizon, maximumStepRadians) {
  const reference = Math.abs(eyeDirection[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const basisX = normalize(cross(reference, eyeDirection));
  const basisY = cross(eyeDirection, basisX);
  const center = eyeDirection.map((component) => component * horizon);
  const radius = Math.sqrt(Math.max(0, 1 - horizon * horizon));
  const angleFor = (point) => Math.atan2(
    dot(point.map((component, index) => component - center[index]), basisY),
    dot(point.map((component, index) => component - center[index]), basisX)
  );
  const start = angleFor(first);
  let delta = angleFor(second) - start;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const steps = Math.max(1, Math.ceil(Math.abs(delta) / maximumStepRadians));
  const points = [];
  for (let step = 1; step < steps; step += 1) {
    const angle = start + delta * step / steps;
    points.push(center.map((component, index) => component + radius * (
      basisX[index] * Math.cos(angle) + basisY[index] * Math.sin(angle)
    )));
  }
  return points;
}

export function visibleLineFragments(units, eyeDirection, horizon) {
  const fragments = [];
  let current = [];
  for (let index = 0; index < units.length; index += 1) {
    const point = units[index];
    const inside = dot(point, eyeDirection) > horizon;
    if (index === 0) {
      if (inside) current.push(point);
      continue;
    }
    const previous = units[index - 1];
    const previousInside = dot(previous, eyeDirection) > horizon;
    if (previousInside && inside) {
      current.push(point);
    } else if (previousInside && !inside) {
      current.push(segmentIntersection(previous, point, eyeDirection, horizon));
      if (current.length > 1) fragments.push(current);
      current = [];
    } else if (!previousInside && inside) {
      current = [segmentIntersection(previous, point, eyeDirection, horizon), point];
    }
  }
  if (current.length > 1) fragments.push(current);
  return fragments;
}

export function clipVisibleRing(units, eyeDirection, horizon, maximumStepRadians) {
  const startIndex = units.findIndex((point) => dot(point, eyeDirection) > horizon);
  if (startIndex < 0) return [];
  if (units.every((point) => dot(point, eyeDirection) > horizon)) return units;

  const ring = units.slice(startIndex).concat(units.slice(0, startIndex));
  const output = [ring[0]];
  let pendingExit = null;
  for (let index = 0; index < ring.length; index += 1) {
    const first = ring[index];
    const second = ring[(index + 1) % ring.length];
    const firstInside = dot(first, eyeDirection) > horizon;
    const secondInside = dot(second, eyeDirection) > horizon;
    if (firstInside && secondInside) {
      if (index + 1 < ring.length) output.push(second);
    } else if (firstInside && !secondInside) {
      pendingExit = segmentIntersection(first, second, eyeDirection, horizon);
      output.push(pendingExit);
    } else if (!firstInside && secondInside) {
      const entry = segmentIntersection(first, second, eyeDirection, horizon);
      if (pendingExit) {
        output.push(...horizonArc(
          pendingExit, entry, eyeDirection, horizon, maximumStepRadians
        ));
      }
      output.push(entry);
      if (index + 1 < ring.length) output.push(second);
      pendingExit = null;
    }
  }
  return output;
}

export function projectUnitPoint(point, viewProjection, viewportWidth, viewportHeight) {
  const clipX = viewProjection[0] * point[0] + viewProjection[4] * point[1] +
    viewProjection[8] * point[2] + viewProjection[12];
  const clipY = viewProjection[1] * point[0] + viewProjection[5] * point[1] +
    viewProjection[9] * point[2] + viewProjection[13];
  const clipW = viewProjection[3] * point[0] + viewProjection[7] * point[1] +
    viewProjection[11] * point[2] + viewProjection[15];
  if (clipW <= 0) return null;
  return {
    x: (clipX / clipW * 0.5 + 0.5) * viewportWidth,
    y: (0.5 - clipY / clipW * 0.5) * viewportHeight
  };
}

export class GeometryOverlayLayer {
  constructor(canvas, {
    devicePixelRatio = () => window.devicePixelRatio || 1,
    onAvailabilityChange = () => {}
  } = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    if (!this.context) throw new Error('Canvas 2D is unavailable for geometry overlays');
    this.devicePixelRatio = devicePixelRatio;
    this.onAvailabilityChange = onAvailabilityChange;
    this.geometry = null;
    this.preparedGeometry = null;
    this.frameState = null;
    this.enabled = true;
    this.destroyed = false;
    this.revision = 0;
    this.lastRenderSignature = '';
  }

  setGeometry(geometry) {
    const wasAvailable = this.hasGeometry();
    this.geometry = geometry && geometry.coordinateCount > 0 ? geometry : null;
    this.preparedGeometry = prepareGeometry(this.geometry);
    this.revision += 1;
    const available = this.hasGeometry();
    if (available !== wasAvailable) this.onAvailabilityChange(available);
    this.render();
  }

  hasGeometry() {
    return Boolean(this.geometry && this.geometry.coordinateCount > 0);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.revision += 1;
    this.render();
  }

  update(frameState) {
    this.frameState = frameState;
    this.render();
  }

  render() {
    if (this.destroyed || !this.frameState) return;
    const frame = this.frameState;
    const ratio = Math.max(1, this.devicePixelRatio());
    const width = Math.max(1, Math.round(frame.viewportWidth * ratio));
    const height = Math.max(1, Math.round(frame.viewportHeight * ratio));
    const signature = [
      this.revision,
      width,
      height,
      frame.viewportWidth,
      frame.viewportHeight,
      ratio,
      frame.longitude,
      frame.latitude,
      frame.distance
    ].join('/');
    if (signature === this.lastRenderSignature) return;
    this.lastRenderSignature = signature;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const context = this.context;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, frame.viewportWidth, frame.viewportHeight);
    if (!this.enabled || !this.hasGeometry()) return;

    const horizon = 1 / frame.distance;
    const maximumStepRadians = Math.max(
      0.25 * DEG_TO_RAD,
      Math.min(2 * DEG_TO_RAD, frame.centerRadiansPerCssPixel * 16)
    );
    const trace = (units) => {
      let started = false;
      for (const unit of units) {
        const point = projectUnitPoint(
          unit, frame.viewProjection, frame.viewportWidth, frame.viewportHeight
        );
        if (!point) continue;
        if (!started) {
          context.moveTo(point.x, point.y);
          started = true;
        } else {
          context.lineTo(point.x, point.y);
        }
      }
      return started;
    };

    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.globalAlpha = 0.5;
    for (const polygon of this.preparedGeometry.polygons) {
      context.beginPath();
      let drewRing = false;
      for (const ring of [...polygon.outer, ...polygon.holes]) {
        const units = densifyUnits(ring, maximumStepRadians, true);
        const clipped = clipVisibleRing(
          units, frame.eyeDirection, horizon, maximumStepRadians
        );
        if (clipped.length >= 3 && trace(clipped)) {
          context.closePath();
          drewRing = true;
        }
      }
      if (!drewRing) continue;
      context.fillStyle = '#f00';
      context.fill('evenodd');
      context.strokeStyle = '#000';
      context.lineWidth = 2;
      context.stroke();
    }

    context.strokeStyle = '#00f';
    context.lineWidth = 4;
    for (const line of this.preparedGeometry.lines) {
      const units = densifyUnits(line, maximumStepRadians);
      for (const fragment of visibleLineFragments(units, frame.eyeDirection, horizon)) {
        context.beginPath();
        if (trace(fragment)) context.stroke();
      }
    }
    context.globalAlpha = 1;
  }

  destroy() {
    this.destroyed = true;
    this.geometry = null;
    this.preparedGeometry = null;
    this.frameState = null;
    this.lastRenderSignature = '';
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

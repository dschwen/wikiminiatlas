import { normalizeLegacyKmlOverlay } from './geometry-overlay-model.mjs';

export function parentOriginFrom({ explicitOrigin = '', referrer = '' } = {}) {
  if (explicitOrigin) {
    try {
      return new URL(explicitOrigin).origin;
    } catch (error) {
      return null;
    }
  }
  if (!referrer) return null;
  try {
    return new URL(referrer).origin;
  } catch (error) {
    return null;
  }
}

export function parseLegacyKmlMessage(data, options) {
  let value = data;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  if (!value || typeof value !== 'object' ||
      !('ways' in value || 'areas' in value)) {
    return null;
  }
  return normalizeLegacyKmlOverlay(value, options);
}

export function parseLegacyCoordinateMessage(data, {
  maximumCoordinates = 2000,
  maximumTitleLength = 500
} = {}) {
  let value = data;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  if (!value || typeof value !== 'object' || !Array.isArray(value.coords)) {
    return null;
  }
  if (value.coords.length > maximumCoordinates) {
    throw new RangeError('legacy marker message contains too many coordinates');
  }

  const markers = [];
  value.coords.forEach((coordinate, index) => {
    if (!coordinate || typeof coordinate !== 'object') return;
    const latitude = Number(coordinate.lat);
    const longitude = Number(coordinate.lon);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude)) {
      return;
    }
    markers.push({
      index,
      latitude,
      longitude,
      title: String(coordinate.title || '').slice(0, maximumTitleLength)
    });
  });
  return markers;
}

export class LegacyKmlBridge {
  constructor({
    windowObject = window,
    expectedOrigin = null,
    onGeometry,
    onCoordinates = () => {},
    maximumCoordinates
  }) {
    this.windowObject = windowObject;
    this.expectedOrigin = expectedOrigin;
    this.onGeometry = onGeometry;
    this.onCoordinates = onCoordinates;
    this.maximumCoordinates = maximumCoordinates;
    this.onMessage = (event) => {
      if (event.source !== this.windowObject.parent) return;
      if (this.expectedOrigin && event.origin !== this.expectedOrigin) return;
      let coordinates;
      let geometry;
      try {
        coordinates = parseLegacyCoordinateMessage(event.data, {
          maximumCoordinates: this.maximumCoordinates
        });
        geometry = parseLegacyKmlMessage(event.data, {
          maximumCoordinates: this.maximumCoordinates
        });
      } catch (error) {
        return;
      }
      if (coordinates) this.onCoordinates(coordinates);
      if (geometry) this.onGeometry(geometry);
    };
    this.windowObject.addEventListener('message', this.onMessage);
  }

  requestGeometry() {
    if (this.windowObject.parent === this.windowObject) return;
    this.windowObject.parent.postMessage('request', this.expectedOrigin || '*');
  }

  postMarkerEvent(command, index) {
    if (this.windowObject.parent === this.windowObject) return;
    if (!['highlight', 'unhighlight', 'scroll'].includes(command) ||
        !Number.isInteger(index) || index < 0) {
      throw new TypeError('invalid legacy marker event');
    }
    this.windowObject.parent.postMessage(
      `${command}, ${index}`,
      this.expectedOrigin || '*'
    );
  }

  destroy() {
    this.windowObject.removeEventListener('message', this.onMessage);
  }
}

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

export class LegacyKmlBridge {
  constructor({
    windowObject = window,
    expectedOrigin = null,
    onGeometry,
    maximumCoordinates
  }) {
    this.windowObject = windowObject;
    this.expectedOrigin = expectedOrigin;
    this.onGeometry = onGeometry;
    this.maximumCoordinates = maximumCoordinates;
    this.onMessage = (event) => {
      if (event.source !== this.windowObject.parent) return;
      if (this.expectedOrigin && event.origin !== this.expectedOrigin) return;
      let geometry;
      try {
        geometry = parseLegacyKmlMessage(event.data, {
          maximumCoordinates: this.maximumCoordinates
        });
      } catch (error) {
        return;
      }
      if (geometry) this.onGeometry(geometry);
    };
    this.windowObject.addEventListener('message', this.onMessage);
  }

  requestGeometry() {
    if (this.windowObject.parent === this.windowObject) return;
    this.windowObject.parent.postMessage('request', this.expectedOrigin || '*');
  }

  destroy() {
    this.windowObject.removeEventListener('message', this.onMessage);
  }
}

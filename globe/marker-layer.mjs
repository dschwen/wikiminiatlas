import { projectGeographicPoint } from './label-model.mjs';

function sameCoordinate(first, second) {
  return first && second &&
    Math.abs(first.latitude - second.latitude) <= 0.0001 &&
    Math.abs(first.longitude - second.longitude) <= 0.0001;
}

function markerTitle(marker) {
  let title = String(marker.title || '');
  try {
    title = decodeURIComponent(title.replace(/\+/g, ' '));
  } catch (error) {
    // Preserve malformed legacy titles rather than dropping the marker.
  }
  return title;
}

export class GlobeMarkerLayer {
  constructor(container, {
    primaryMarker = null,
    onMarkerEvent = () => {}
  } = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('GlobeMarkerLayer requires an HTML container');
    }
    this.container = container;
    this.primaryMarker = primaryMarker;
    this.onMarkerEvent = onMarkerEvent;
    this.extraMarkers = [];
    this.nodes = new Map();
    this.frameState = null;
  }

  setPrimaryMarker(marker) {
    this.primaryMarker = marker;
    this.container.replaceChildren();
    this.nodes.clear();
    this.render();
  }

  setExtraMarkers(markers) {
    this.extraMarkers = markers.filter((marker) =>
      !sameCoordinate(marker, this.primaryMarker)
    );
    this.container.replaceChildren();
    this.nodes.clear();
    this.render();
  }

  createNode(marker) {
    if (marker.primary) {
      const node = document.createElement('span');
      node.className = 'globe-marker globe-marker-primary';
      node.setAttribute('role', 'img');
      node.setAttribute('aria-label', 'Current article coordinates');
      return node;
    }

    const node = document.createElement('button');
    const title = markerTitle(marker);
    node.className = 'globe-marker globe-marker-extra';
    node.type = 'button';
    node.title = title;
    node.setAttribute(
      'aria-label',
      title ? `Article coordinate: ${title}` : `Article coordinate ${marker.index + 1}`
    );
    node.addEventListener('mouseenter', () => {
      this.onMarkerEvent('highlight', marker.index);
    });
    node.addEventListener('mouseleave', () => {
      this.onMarkerEvent('unhighlight', marker.index);
    });
    node.addEventListener('focus', () => {
      this.onMarkerEvent('highlight', marker.index);
    });
    node.addEventListener('blur', () => {
      this.onMarkerEvent('unhighlight', marker.index);
    });
    node.addEventListener('click', () => {
      this.onMarkerEvent('scroll', marker.index);
    });
    return node;
  }

  render() {
    if (!this.frameState) return;
    const markers = this.extraMarkers.map((marker) => ({
      ...marker,
      key: `extra:${marker.index}`,
      primary: false
    }));
    if (this.primaryMarker) {
      markers.push({
        ...this.primaryMarker,
        key: 'primary',
        primary: true
      });
    }

    const visibleKeys = new Set();
    for (const marker of markers) {
      const projection = projectGeographicPoint({
        longitude: marker.longitude,
        latitude: marker.latitude,
        eyeDirection: this.frameState.eyeDirection,
        distance: this.frameState.distance,
        viewProjection: this.frameState.viewProjection,
        viewportWidth: this.frameState.viewportWidth,
        viewportHeight: this.frameState.viewportHeight
      });
      if (!projection) continue;

      visibleKeys.add(marker.key);
      let node = this.nodes.get(marker.key);
      if (!node) {
        node = this.createNode(marker);
        this.container.append(node);
        this.nodes.set(marker.key, node);
      }
      node.style.transform =
        `translate3d(${projection.x.toFixed(1)}px, ${projection.y.toFixed(1)}px, 0)`;
    }

    for (const [key, node] of this.nodes) {
      if (!visibleKeys.has(key)) {
        node.remove();
        this.nodes.delete(key);
      }
    }
  }

  update(frameState) {
    this.frameState = frameState;
    this.render();
  }

  destroy() {
    this.nodes.clear();
    this.container.replaceChildren();
    this.frameState = null;
  }
}

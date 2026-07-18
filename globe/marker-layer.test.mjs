import test from 'node:test';
import assert from 'node:assert/strict';

import { GlobeMarkerLayer } from './marker-layer.mjs';
import { lookAt, multiply, perspective } from './mat4.mjs';
import { lonLatToUnitSphere } from './plate-carree-grid.mjs';

class FakeElement {
  constructor() {
    this.children = [];
    this.listeners = new Map();
    this.style = {};
  }

  append(node) {
    node.parent = this;
    this.children.push(node);
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  dispatch(name) {
    this.listeners.get(name)?.();
  }

  setAttribute(name, value) {
    this[name] = String(value);
  }

  replaceChildren() {
    this.children = [];
  }

  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((node) => node !== this);
    }
  }
}

global.HTMLElement = FakeElement;
global.document = { createElement: () => new FakeElement() };

function frameState(longitude = 0) {
  const eyeDirection = lonLatToUnitSphere(longitude, 0);
  const distance = 3;
  const eye = eyeDirection.map((component) => component * distance);
  return {
    eyeDirection,
    distance,
    viewProjection: multiply(
      perspective(42 * Math.PI / 180, 1.5, 0.1, 4.1),
      lookAt(eye, [0, 0, 0], [0, 1, 0])
    ),
    viewportWidth: 900,
    viewportHeight: 600
  };
}

test('projects the primary marker and omits duplicate article coordinates', () => {
  const container = new FakeElement();
  const layer = new GlobeMarkerLayer(container, {
    primaryMarker: { latitude: 0, longitude: 0 }
  });
  layer.setExtraMarkers([
    { index: 0, latitude: 0, longitude: 0, title: 'Primary' },
    { index: 1, latitude: 5, longitude: 5, title: 'Other' }
  ]);
  layer.update(frameState());

  assert.equal(container.children.length, 2);
  assert.match(container.children[0].className, /globe-marker-extra/);
  assert.match(container.children[1].className, /globe-marker-primary/);
  assert.match(container.children[1].style.transform, /^translate3d\(/);
  layer.destroy();
});

test('emits the legacy highlight and scroll commands with original indexes', () => {
  const events = [];
  const container = new FakeElement();
  const layer = new GlobeMarkerLayer(container, {
    onMarkerEvent: (...event) => events.push(event)
  });
  layer.setExtraMarkers([
    { index: 7, latitude: 0, longitude: 0, title: 'Seven%20Hills' }
  ]);
  layer.update(frameState());

  const marker = container.children[0];
  assert.equal(marker.title, 'Seven Hills');
  marker.dispatch('mouseenter');
  marker.dispatch('mouseleave');
  marker.dispatch('click');
  assert.deepEqual(events, [
    ['highlight', 7],
    ['unhighlight', 7],
    ['scroll', 7]
  ]);
  layer.destroy();
});

test('removes markers that rotate behind the horizon', () => {
  const container = new FakeElement();
  const layer = new GlobeMarkerLayer(container);
  layer.setExtraMarkers([
    { index: 0, latitude: 0, longitude: 0, title: '' }
  ]);
  layer.update(frameState());
  assert.equal(container.children.length, 1);
  layer.update(frameState(180));
  assert.equal(container.children.length, 0);
  layer.destroy();
});

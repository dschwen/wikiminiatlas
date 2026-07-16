import {
  CELESTIAL_BODIES,
  celestialBodyById,
  LABEL_LANGUAGES,
  legacyTileSourceUrl,
  tileSourceById
} from './catalog.mjs';
import { GlobeRenderer } from './globe-renderer.mjs';
import { GlobeLabelLayer } from './label-layer.mjs';
import { PlateCarreeGrid } from './plate-carree-grid.mjs';
import { readCameraState, writeCameraState } from './session-state.mjs';

const canvas = document.querySelector('#globe');
const viewport = document.querySelector('#viewport');
const labelContainer = document.querySelector('#labels');
const controls = document.querySelector('#controls');
const controlsToggle = document.querySelector('#controls-toggle');
const bodySetControl = document.querySelector('#body-set');
const tileSetControl = document.querySelector('#tile-set');
const labelSetControl = document.querySelector('#label-set');
const status = document.querySelector('#status');
const credit = document.querySelector('#credit');
const errorPanel = document.querySelector('#error');
const parameters = new URLSearchParams(window.location.search);
const tileBase = parameters.get('tileBase') || '../tiles';
const requestedMaximumZoom = Number(parameters.get('maxZoom'));
const configuredMaximumZoom = parameters.has('maxZoom') && Number.isInteger(requestedMaximumZoom)
  ? Math.max(0, Math.min(20, requestedMaximumZoom))
  : 15;
const restoredCamera = readCameraState(window.history.state);
const requestedDistance = Number(parameters.get('distance'));
const distanceSource = parameters.has('distance') &&
  Number.isFinite(requestedDistance) && requestedDistance > 1
  ? requestedDistance
  : restoredCamera ? restoredCamera.distance : 3.1;
const initialDistance = Math.max(
  1.0005,
  Math.min(51, distanceSource)
);
const initialLongitude = restoredCamera ? restoredCamera.longitude : -112;
const initialLatitude = restoredCamera ? restoredCamera.latitude : 35;
let labelsEnabled = parameters.get('labels') !== '0';
const labelBase = parameters.get('labelBase') || '../label.php';
let labelLanguage = parameters.get('lang') || 'en';
let celestialBody = celestialBodyById(parameters.get('globe'));
let tileSource = tileSourceById(parameters.get('tileSet'), celestialBody);

for (const body of CELESTIAL_BODIES) {
  bodySetControl.add(new Option(body.label, body.id));
}
bodySetControl.value = celestialBody.id;

function populateTileSets(selectedSource) {
  tileSetControl.replaceChildren();
  for (const source of celestialBody.sources) {
    tileSetControl.add(new Option(source.label, source.id));
  }
  tileSource = tileSourceById(selectedSource, celestialBody);
  tileSetControl.value = tileSource.id;
}

populateTileSets(parameters.get('tileSet'));

labelSetControl.add(new Option('Off', ''));
for (const [code, name] of LABEL_LANGUAGES) {
  labelSetControl.add(new Option(name, code));
}
if (labelsEnabled && ![...labelSetControl.options].some((option) => option.value === labelLanguage)) {
  labelSetControl.add(new Option(labelLanguage, labelLanguage));
}
labelSetControl.value = labelsEnabled ? labelLanguage : '';

function updateLocationParameters(changes) {
  const url = new URL(window.location.href);
  for (const [name, value] of Object.entries(changes)) {
    if (value === null) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
  }
  try {
    window.history.replaceState(window.history.state, '', url);
  } catch (error) {
    // URL persistence is optional when an embedding host restricts History API writes.
  }
}

function updateSourcePresentation() {
  labelContainer.style.setProperty('--globe-label-color', tileSource.labelColor);
  labelContainer.style.setProperty('--globe-label-shadow', tileSource.labelTextShadow);
  viewport.dataset.equatorialCircumferenceKm =
    String(celestialBody.equatorialCircumferenceKm);
  canvas.setAttribute(
    'aria-label',
    `Interactive three-dimensional globe of ${celestialBody.label}. ` +
      'Drag to orbit and pinch to zoom.'
  );
  document.title = `WikiMiniAtlas · ${celestialBody.label}`;

  credit.replaceChildren();
  for (const [index, item] of tileSource.attribution.entries()) {
    if (index > 0) {
      credit.append(document.createTextNode(' · '));
    }
    const link = document.createElement('a');
    link.href = item.href;
    link.target = '_top';
    link.rel = 'noopener';
    link.textContent = item.label;
    credit.append(link);
  }
  credit.hidden = tileSource.attribution.length === 0;
}

updateSourcePresentation();

try {
  const grid = new PlateCarreeGrid();
  let labelStats = { visible: 0 };
  let globeState = null;
  let storedCameraSignature = '';
  let cameraStoreTimer = null;
  const storeCameraState = () => {
    if (!globeState) {
      return;
    }
    const camera = {
      latitude: globeState.latitude,
      longitude: globeState.longitude,
      distance: globeState.distance
    };
    const signature = `${camera.latitude}/${camera.longitude}/${camera.distance}`;
    if (signature === storedCameraSignature) {
      return;
    }
    try {
      window.history.replaceState(
        writeCameraState(window.history.state, camera),
        ''
      );
      storedCameraSignature = signature;
    } catch (error) {
      // Camera persistence is optional when a host restricts History API writes.
    }
  };
  const scheduleCameraStateStore = () => {
    if (cameraStoreTimer !== null) {
      clearTimeout(cameraStoreTimer);
    }
    cameraStoreTimer = setTimeout(() => {
      cameraStoreTimer = null;
      storeCameraState();
    }, 200);
  };
  const updateStatus = () => {
    if (!globeState) {
      return;
    }
    const state = globeState;
    const signedLongitude = state.longitude > 180
      ? state.longitude - 360
      : state.longitude;
    const residentMiB = state.residentBytes / (1024 * 1024);
    const compact = canvas.clientWidth < 700 || canvas.clientHeight < 480;
    const labelSummary = labelsEnabled ? `${labelStats.visible} labels` : 'labels off';
    const tileSummary = state.minimumRenderedZoom === state.maximumRenderedZoom
      ? `tile z${state.zoom}`
      : `front z${state.zoom} · visible z${state.minimumRenderedZoom}–${state.maximumRenderedZoom}`;
    const summary = [
      celestialBody.label,
      `${state.latitude.toFixed(1)}° lat`,
      `${signedLongitude.toFixed(1)}° lon`,
      tileSummary,
      `${state.frontTilePixels.toFixed(0)} px/tile`,
      `${state.readyTiles} exact + ${state.fallbackTiles} parent + ${state.placeholderTiles} blank`,
      `${state.residentTextures} textures (${residentMiB.toFixed(1)} MiB)`,
      `${state.inFlight} loading${state.tileBudgetLimited ? ' · tile budget reached' : ''}`,
      labelSummary
    ];
    status.textContent = compact
      ? [celestialBody.label, summary[1], summary[2], `tile z${state.zoom}`, labelSummary].join(' · ')
      : summary.join(' · ');
  };
  const labelLayer = new GlobeLabelLayer(labelContainer, {
    grid,
    labelBase,
    language: labelLanguage,
    globe: celestialBody.labelDataset,
    enabled: labelsEnabled,
    onStateChange: (state) => {
      labelStats = state;
      updateStatus();
    }
  });
  const globe = new GlobeRenderer(canvas, {
    grid,
    interactionElement: viewport,
    maximumZoom: Math.min(configuredMaximumZoom, tileSource.maximumZoom),
    initialDistance,
    initialLongitude,
    initialLatitude,
    tileUrl: (tile) => legacyTileSourceUrl(tileBase, tileSource, tile),
    onStateChange: (state) => {
      globeState = state;
      labelLayer.update(state);
      scheduleCameraStateStore();
      updateStatus();
    }
  });

  const setControlsOpen = (open) => {
    controls.hidden = !open;
    controlsToggle.setAttribute('aria-expanded', String(open));
  };
  const toggleControls = () => setControlsOpen(controls.hidden);
  const closeControlsFromOutside = (event) => {
    if (!controls.hidden && !controls.contains(event.target) && event.target !== controlsToggle) {
      setControlsOpen(false);
    }
  };
  const closeControlsFromKeyboard = (event) => {
    if (event.key === 'Escape' && !controls.hidden) {
      setControlsOpen(false);
      controlsToggle.focus();
    }
  };
  const preventControlSubmit = (event) => event.preventDefault();
  controlsToggle.addEventListener('click', toggleControls);
  controls.addEventListener('submit', preventControlSubmit);
  document.addEventListener('pointerdown', closeControlsFromOutside);
  document.addEventListener('keydown', closeControlsFromKeyboard);

  const applyTileSource = () => {
    const selectedSource = tileSource;
    globe.setTileSource({
      tileUrl: (tile) => legacyTileSourceUrl(tileBase, selectedSource, tile),
      maximumZoom: Math.min(configuredMaximumZoom, selectedSource.maximumZoom)
    });
    updateSourcePresentation();
  };
  const changeBody = () => {
    celestialBody = celestialBodyById(bodySetControl.value);
    populateTileSets(null);
    applyTileSource();
    labelLayer.setGlobe(celestialBody.labelDataset);
    updateLocationParameters({
      globe: celestialBody.id === CELESTIAL_BODIES[0].id ? null : celestialBody.id,
      tileSet: null
    });
    updateStatus();
    setControlsOpen(false);
  };
  const changeTileSet = () => {
    tileSource = tileSourceById(tileSetControl.value, celestialBody);
    applyTileSource();
    updateLocationParameters({
      tileSet: tileSource.id === celestialBody.sources[0].id ? null : tileSource.id
    });
    updateStatus();
    setControlsOpen(false);
  };
  const changeLabelSet = () => {
    const selectedLanguage = labelSetControl.value;
    labelsEnabled = selectedLanguage !== '';
    if (labelsEnabled) {
      labelLanguage = selectedLanguage;
      labelLayer.setLanguage(labelLanguage);
    }
    labelLayer.setEnabled(labelsEnabled);
    updateLocationParameters({
      labels: labelsEnabled ? null : '0',
      lang: labelsEnabled && labelLanguage !== 'en' ? labelLanguage : null
    });
    updateStatus();
    setControlsOpen(false);
  };
  bodySetControl.addEventListener('change', changeBody);
  tileSetControl.addEventListener('change', changeTileSet);
  labelSetControl.addEventListener('change', changeLabelSet);

  let destroyed = false;
  const destroy = () => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    if (cameraStoreTimer !== null) {
      clearTimeout(cameraStoreTimer);
      cameraStoreTimer = null;
    }
    globe.destroy();
    labelLayer.destroy();
    controlsToggle.removeEventListener('click', toggleControls);
    controls.removeEventListener('submit', preventControlSubmit);
    document.removeEventListener('pointerdown', closeControlsFromOutside);
    document.removeEventListener('keydown', closeControlsFromKeyboard);
    bodySetControl.removeEventListener('change', changeBody);
    tileSetControl.removeEventListener('change', changeTileSet);
    labelSetControl.removeEventListener('change', changeLabelSet);
  };
  window.addEventListener('pagehide', (event) => {
    if (cameraStoreTimer !== null) {
      clearTimeout(cameraStoreTimer);
      cameraStoreTimer = null;
    }
    storeCameraState();
    if (!event.persisted) {
      destroy();
    }
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && !destroyed) {
      globe.requestRender();
    }
  });
} catch (error) {
  errorPanel.hidden = false;
  errorPanel.textContent = `Unable to start the globe: ${error.message}`;
  throw error;
}

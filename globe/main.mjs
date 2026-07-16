import { LABEL_LANGUAGES, legacyTileSourceUrl, TILE_SOURCES, tileSourceById } from './catalog.mjs';
import { GlobeRenderer } from './globe-renderer.mjs';
import { GlobeLabelLayer } from './label-layer.mjs';
import { PlateCarreeGrid } from './plate-carree-grid.mjs';
import { readCameraState, writeCameraState } from './session-state.mjs';

const canvas = document.querySelector('#globe');
const viewport = document.querySelector('#viewport');
const labelContainer = document.querySelector('#labels');
const tileSetControl = document.querySelector('#tile-set');
const labelSetControl = document.querySelector('#label-set');
const status = document.querySelector('#status');
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
const globeName = parameters.get('globe') || 'earth';
let tileSource = tileSourceById(parameters.get('tileSet'));

for (const source of TILE_SOURCES) {
  tileSetControl.add(new Option(source.label, source.id));
}
tileSetControl.value = tileSource.id;

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
    const summary = [
      `${state.latitude.toFixed(1)}° lat`,
      `${signedLongitude.toFixed(1)}° lon`,
      state.minimumRenderedZoom === state.maximumRenderedZoom
        ? `tile z${state.zoom}`
        : `front z${state.zoom} · visible z${state.minimumRenderedZoom}–${state.maximumRenderedZoom}`,
      `${state.frontTilePixels.toFixed(0)} px/tile`,
      `${state.readyTiles} exact + ${state.fallbackTiles} parent + ${state.placeholderTiles} blank`,
      `${state.residentTextures} textures (${residentMiB.toFixed(1)} MiB)`,
      `${state.inFlight} loading${state.tileBudgetLimited ? ' · tile budget reached' : ''}`,
      labelsEnabled ? `${labelStats.visible} labels` : 'labels off'
    ];
    status.textContent = compact
      ? [summary[0], summary[1], `tile z${state.zoom}`, summary[7]].join(' · ')
      : summary.join(' · ');
  };
  const labelLayer = new GlobeLabelLayer(labelContainer, {
    grid,
    labelBase,
    language: labelLanguage,
    globe: globeName,
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

  const changeTileSet = () => {
    tileSource = tileSourceById(tileSetControl.value);
    globe.setTileSource({
      tileUrl: (tile) => legacyTileSourceUrl(tileBase, tileSource, tile),
      maximumZoom: Math.min(configuredMaximumZoom, tileSource.maximumZoom)
    });
    updateLocationParameters({
      tileSet: tileSource.id === TILE_SOURCES[0].id ? null : tileSource.id
    });
    updateStatus();
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
  };
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

import { GlobeRenderer, legacyRasterTileUrl } from './globe-renderer.mjs';
import { GlobeLabelLayer } from './label-layer.mjs';
import { PlateCarreeGrid } from './plate-carree-grid.mjs';

const canvas = document.querySelector('#globe');
const labelContainer = document.querySelector('#labels');
const status = document.querySelector('#status');
const errorPanel = document.querySelector('#error');
const parameters = new URLSearchParams(window.location.search);
const tileBase = parameters.get('tileBase') || '../tiles';
const requestedMaximumZoom = Number(parameters.get('maxZoom'));
const maximumZoom = parameters.has('maxZoom') && Number.isInteger(requestedMaximumZoom)
  ? Math.max(0, Math.min(20, requestedMaximumZoom))
  : 15;
const requestedDistance = Number(parameters.get('distance'));
const initialDistance = Math.max(
  1.0005,
  Math.min(51, Number.isFinite(requestedDistance) && requestedDistance > 1
    ? requestedDistance
    : 3.1)
);
const labelsEnabled = parameters.get('labels') !== '0';
const labelBase = parameters.get('labelBase') || '../label.php';
const labelLanguage = parameters.get('lang') || 'en';
const globeName = parameters.get('globe') || 'earth';

try {
  const grid = new PlateCarreeGrid();
  let labelStats = { visible: 0 };
  let globeState = null;
  const updateStatus = () => {
    if (!globeState) {
      return;
    }
    const state = globeState;
    const signedLongitude = state.longitude > 180
      ? state.longitude - 360
      : state.longitude;
    const residentMiB = state.residentBytes / (1024 * 1024);
    status.textContent = [
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
    ].join(' · ');
  };
  const labelLayer = labelsEnabled
    ? new GlobeLabelLayer(labelContainer, {
      grid,
      labelBase,
      language: labelLanguage,
      globe: globeName,
      onStateChange: (state) => {
        labelStats = state;
        updateStatus();
      }
    })
    : null;
  const globe = new GlobeRenderer(canvas, {
    grid,
    maximumZoom,
    initialDistance,
    tileUrl: (tile) => legacyRasterTileUrl(tileBase, tile),
    onStateChange: (state) => {
      globeState = state;
      if (labelLayer) {
        labelLayer.update(state);
      }
      updateStatus();
    }
  });

  window.addEventListener('pagehide', () => {
    globe.destroy();
    if (labelLayer) {
      labelLayer.destroy();
    }
  }, { once: true });
} catch (error) {
  errorPanel.hidden = false;
  errorPanel.textContent = `Unable to start the globe: ${error.message}`;
  throw error;
}

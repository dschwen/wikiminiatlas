import { GlobeRenderer, legacyRasterTileUrl } from './globe-renderer.mjs';
import { PlateCarreeGrid } from './plate-carree-grid.mjs';

const canvas = document.querySelector('#globe');
const status = document.querySelector('#status');
const errorPanel = document.querySelector('#error');
const parameters = new URLSearchParams(window.location.search);
const tileBase = parameters.get('tileBase') || '../tiles';
const maximumZoom = Math.max(0, Math.min(6, Number(parameters.get('maxZoom') || 3)));

try {
  const grid = new PlateCarreeGrid();
  const globe = new GlobeRenderer(canvas, {
    grid,
    maximumZoom,
    tileUrl: (tile) => legacyRasterTileUrl(tileBase, tile),
    onStateChange: (state) => {
      const signedLongitude = state.longitude > 180
        ? state.longitude - 360
        : state.longitude;
      status.textContent = [
        `${state.latitude.toFixed(1)}° lat`,
        `${signedLongitude.toFixed(1)}° lon`,
        `tile z${state.zoom}`,
        `${state.readyTiles}/${state.visibleTiles} loaded`
      ].join(' · ');
    }
  });

  window.addEventListener('pagehide', () => globe.destroy(), { once: true });
} catch (error) {
  errorPanel.hidden = false;
  errorPanel.textContent = `Unable to start the globe: ${error.message}`;
  throw error;
}


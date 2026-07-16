# 3D globe implementation plan

## Goal

Replace the flat DOM/canvas map renderer with a planet-scale WebGL sphere while initially retaining the existing plate carrée raster, vector, and label tile services.

The migration is incremental: the globe prototype remains isolated until it can satisfy the essential navigation and integration contracts of the legacy widget.

## Compatibility boundary

The following contracts remain stable in the first implementation:

- zoom zero is six tile columns by three tile rows;
- each zoom doubles both dimensions;
- longitude wraps at the legacy 0° seam;
- browser/render rows run north-to-south;
- `label.php` rows run south-to-north;
- raster URLs retain their existing `mapnik` path convention; and
- geographic features remain latitude/longitude based.

Plate carrée is a data parameterization and spatial index in the new system. The rendered view is a perspective camera projection of spherical tile patches.

## Delivery slices

### 1. Coordinate and raster foundation — complete

- Extract and test the tile-grid contract.
- Render independently textured curved tile patches.
- Add orbit controls, horizon culling, and pixel-density tile selection.
- Retain visible placeholders for missing tiles.

### 2. Tile refinement — in progress

- Render a loaded parent while detailed child tiles are pending. (Complete.)
- Select tile level from front-surface pixel density rather than fixed distance thresholds. (Complete.)
- Add hierarchical horizon/frustum culling. (Complete.)
- Add request prioritization and bounded concurrency. (Complete.)
- Bound visible leaves, texture memory, resident textures, and cache metadata. (Complete.)
- Delay refinement during active gestures and reduce high-zoom tessellation. (Complete.)
- Eliminate mixed-level z-fighting by drawing each leaf once with an ancestor UV transform. (Complete.)
- Remove any remaining subpixel cracks between differently tessellated neighboring levels.

The current safety limits are 256 visible leaf patches, 12 concurrent image
loads, 384 resident textures, and 32 MiB of estimated RGBA texture data. A leaf
requests only the next missing level in its ancestry. Consequently, coarse imagery
appears first and progressively sharpens without displaying an uninitialized tile.

### 3. Labels — in progress

- Extend the label response to include explicit `lat`, `lon`, and a stable ID. (Complete, backward-compatible.)
- Fetch candidates using the existing latitude/longitude tile boxes. (Complete.)
- Batch up to ten boxes per request and bound concurrency/cache size. (Complete.)
- Cull labels behind the horizon and project anchors to screen coordinates. (Complete.)
- Resolve collisions by weight, reuse stable DOM nodes, and atomically swap completed candidate generations while moving. (Initial implementation complete.)
- Render text labels as accessible Wikipedia links above the WebGL canvas. (Complete.)
- Reuse the legacy per-style label symbols and anchor offsets. (Complete.)
- Replace estimated text bounds with measured collision boxes and avoid UI chrome.
- Add the legacy Commons thumbnail-label behavior.

### 4. Vector geography and buildings

- Add a bounded `/tiles/jsontile.php` client for Earth/full-basemap tiles above
  zoom 12. Responses retain the legacy `{x,y,z,v,data,idx,f}` contract.
- Extract the Canvas 2D style and geometry pass from `wmajt.js` into an ES
  module. Do not import the legacy singleton: it assumes jQuery tile objects,
  mutable globals, append-only building buffers, and an unbounded cache.
- Render each JSON response into a 128- or 256-pixel canvas and upload that
  canvas through the existing WebGL tile texture path. A canvas is a valid
  `TexImageSource`, so the sphere mesh, UVs, culling, and draw loop do not need
  a second vector rendering pipeline.
- Generalize `TileResourceManager` from `Image` loading to an asynchronous tile
  producer returning `{source, width, height}`. Raster sources return decoded
  images; JSON sources return rendered canvases or `ImageBitmap`s.
- Mark source capability in `catalog.mjs` (`jsonFromZoom: 13`) rather than
  checking an Earth tileset index. Other bodies remain raster-only.
- Keep raster zoom 12 and rendered JSON ancestors in the same hierarchy. While
  a detailed JSON tile is loading, the existing ancestor UV transform continues
  showing initialized lower-resolution imagery.
- Bound raw JSON, rendered canvases, GPU textures, metadata, and concurrent
  requests separately. Abort requests that leave the desired tile generation.
- Preserve legacy response compatibility by generating `idx` when `v < 2` or
  the server omits it. Validate coordinates, feature count, geometry depth, and
  response size before drawing.
- First slice: 2D surface styling only. Follow with polygon holes and correct
  layer/bridge/tunnel ordering, then bounded feature picking.
- Later building slice: render buildings in a tile-local east/north/up frame
  with radial height and GPU ownership tied to visible tiles. Do not port the
  append-only global buffers.
- Preserve article and size-comparison overlays as globe-surface geometry.

Acceptance criteria for the JSON-texture slice:

- zoom 13 switches only Earth/full-basemap leaves to `jsontile.php`;
- a missing, slow, malformed, or failed JSON tile retains a raster/vector
  ancestor without a blank flash;
- fixed GeoJSON fixtures produce expected canvas pixels and uploaded textures;
- long zoom/pan sessions remain inside explicit CPU and GPU budgets; and
- switching body or map layer cancels obsolete JSON work and cannot mix sources.

### 5. Legacy integration

- Port markers, layer/body selection, synopsis, Commons previews, and host messaging.
- Article synopsis on Ctrl/Cmd hover. (Complete for Wikipedia text labels.)
- Define camera altitude compatibility for existing numeric zoom commands.
  (Complete for initial legacy `wma` URLs.)
- Preserve camera and renderer state across back/forward navigation. (Complete in prototype.)
- Add explicit lifecycle and error states.
- Switch the primary entry point only after side-by-side behavior tests pass.

#### URL compatibility matrix

The globe parser now accepts both legacy entry forms:

```text
?wma=lat_lon_width_height_site_zoom_uiLanguage&globe=Earth&lang=en&page=Title&awt=0
?lat_lon_width_height_site_zoom_uiLanguage_centerLat_centerLon&globe=Earth
```

Implemented mappings:

| Legacy field | Globe behavior |
| --- | --- |
| `wma[0:2]` | marker/recenter latitude and longitude |
| `wma[2:4]` | parsed for compatibility; iframe viewport remains authoritative, matching current 2D behavior |
| `wma[4]` | label language |
| `wma[5]` | converted to camera altitude by matching center radians per pixel |
| `wma[6]` | retained as UI-language metadata; UI localization remains to port |
| `wma[7:9]` | optional independent initial camera center |
| `globe` | case-insensitive celestial body selection |
| `lang` / `page` | reserved for host article language/title, as in 2D |
| `awt` | parsed; legacy tooltip policy remains to port |

The new explicit label override is `labelLang`; `lang` must not be reused for
labels because doing so breaks existing Wikipedia iframe URLs.

Remaining requirements before `/globe/` can replace `/iframe.html` without a
host-script change:

- display the primary marker and extra markers;
- port WIWOSM article geometry for `lang` + `page`;
- implement the accepted and emitted `postMessage` contracts (`coords`,
  `ways/areas`, `getcoords`, `moveto`, highlight/scroll);
- decide whether `awt=1` opens summaries without a modifier;
- add UI localization from `wma[6]`;
- cover Commons labels/previews; and
- deploy an `iframe.html` compatibility entry or change the embedder only after
  side-by-side tests confirm equivalent behavior.

## First-slice acceptance criteria

- Coordinate tests cover dimensions, seam wrapping, poles, label row conversion, and pixel round trips.
- The demo displays a sphere even when no raster tiles are locally installed.
- Available legacy raster tiles follow the sphere without stitching them into a global texture.
- Dragging orbits the camera and scrolling changes both altitude and tile detail.
- Tiles wholly beyond the geometric horizon are not submitted.
- The prototype does not alter the existing application entry points.

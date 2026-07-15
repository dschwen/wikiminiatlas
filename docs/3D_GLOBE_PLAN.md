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
- Replace estimated text bounds with measured collision boxes and avoid UI chrome.
- Add the legacy Commons thumbnail-label behavior.

### 4. Vector geography and buildings

- Convert vector tile coordinates to spherical positions.
- Subdivide long edges so lines follow the surface.
- Render buildings in a tile-local east/north/up frame with radial height.
- Preserve article and size-comparison overlays as globe-surface geometry.

### 5. Legacy integration

- Port markers, layer/body selection, synopsis, Commons previews, and host messaging.
- Define camera altitude compatibility for existing numeric zoom commands.
- Add explicit lifecycle and error states.
- Switch the primary entry point only after side-by-side behavior tests pass.

## First-slice acceptance criteria

- Coordinate tests cover dimensions, seam wrapping, poles, label row conversion, and pixel round trips.
- The demo displays a sphere even when no raster tiles are locally installed.
- Available legacy raster tiles follow the sphere without stitching them into a global texture.
- Dragging orbits the camera and scrolling changes both altitude and tile detail.
- Tiles wholly beyond the geometric horizon are not submitted.
- The prototype does not alter the existing application entry points.

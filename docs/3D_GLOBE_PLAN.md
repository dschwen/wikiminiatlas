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

### 1. Coordinate and raster foundation — in progress

- Extract and test the tile-grid contract.
- Render independently textured curved tile patches.
- Add orbit controls, horizon culling, and distance-based tile selection.
- Retain visible placeholders for missing tiles.

### 2. Tile refinement

- Render a loaded parent while detailed child tiles are pending.
- Select tile level from screen-space error rather than fixed distance thresholds.
- Add frustum culling, request prioritization, and bounded concurrency.
- Eliminate visible seams between adjacent patches and mixed levels.

### 3. Labels

- Extend the label response to include explicit `lat`, `lon`, and a stable ID.
- Fetch candidates using the existing latitude/longitude tile boxes.
- Cull labels behind the horizon and project anchors to screen coordinates.
- Resolve collisions by weight and maintain temporal stability while moving.
- Initially render labels as accessible HTML links above the WebGL canvas.

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


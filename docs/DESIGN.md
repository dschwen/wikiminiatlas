# WikiMiniAtlas client design and technical assessment

## Scope and status

This document describes the browser client implemented by:

- `wmacore.js` — widget setup, map state, tile reuse, labels, controls, overlays, and integration.
- `wmajt.js` — high-zoom GeoJSON tile rendering and 3D-building geometry generation.
- `wmaglobe3d.js` — the small WebGL overview globe.

The assessment is based on the current source, not the checked-in minified copies. It is a description of the system as it exists, including known defects, rather than a specification that every code path currently satisfies.

## Executive summary

WikiMiniAtlas is a single-instance, browser-global map widget. It uses a reusable grid of 128 px DOM tiles, an equirectangular world model, server-rendered raster tiles at lower zooms, and client-rendered GeoJSON tiles at high zooms. Labels remain separate DOM elements. Additional canvases draw article outlines, size comparisons, 3D buildings, and a low-resolution overview globe.

The implementation has several good ideas for its era: constant-size tile reuse, parent-tile fallback, tag indexes for vector styling, high-DPI canvases, a 2D fallback for buildings, and support for multiple planetary bodies. The principal problem is not any one algorithm; it is that state, rendering, transport, UI, and external integration are tightly coupled through mutable globals, DOM IDs, and undocumented data contracts. This makes failures hard to isolate and prevents safe multi-instance use.

The highest-priority findings are concrete correctness and security issues:

1. Size overlays containing line geometry call the undefined `latNorm` function (`wmacore.js:2510`); the local function is named `norm`.
2. Incoming `postMessage` data is accepted from every origin and parsed without a guard (`wmacore.js:2259-2329`). Some outgoing messages also use `"*"`.
3. The WebGL building buffer overflow path copies vertices but not normals (`wmajt.js:851-859`), corrupting lighting after a buffer boundary.
4. The 2D-building refresh timer is never stored in `bldg3dtimer` (`wmacore.js:1650-1653`), so repeated redraws can create multiple timer chains.
5. Raster retry loops, label/vector caches, and WebGL building buffers are unbounded. Panning can therefore cause continuing requests and permanent memory/GPU growth.
6. The production script aggregator requires `medians.js`, but that file is absent from the repository. A checkout is not a complete reproducible deployment.

## Runtime composition

The production iframe loads `wikiminiatlas_extern.php`, which concatenates dependencies in this order:

1. jQuery and the JSON compatibility layer
2. `utils.js` (`requestAnimFrame` compatibility helper)
3. glMatrix 0.9.5
4. `wmaglobe3d.js`
5. Poly2Tri
6. `medians.js` (currently missing) and the i18n data
7. `wmajt.js`
8. `wmacore.js`

The iframe also owns both sets of shader source in DOM `<script>` elements. `wikiminiatlasInstall($('#wma_widget'))` starts the application after DOM ready.

```text
iframe.html / iframe_dev.html
        |
        v
wikiminiatlasInstall()                    external services
        |                                -----------------
        +--> map tile grid  <---------- raster tile servers
        |       |          <---------- label.php
        |       +----------> wmajt <--- /tiles/jsontile.php
        |
        +--> KML/size canvases <------- WIWOSM GeoJSON
        +--> synopsis panel   <-------- Wikipedia REST API
        +--> overview globe ----------> wmaglobe3d
        +--> parent integration <------> window.postMessage
```

All three files assume sloppy-mode scripts and pre-existing globals. They are not independently loadable modules.

## Coordinate and tile model

Despite some comments mentioning Mercator, the interactive map uses a plate carrée/equirectangular projection:

```text
worldHeight = 3 * 2^zoom * 128 px
worldWidth  = 6 * 2^zoom * 128 px
x = longitude / 360 * worldWidth
y = (0.5 - latitude / 180) * worldHeight
```

At zoom 0 the world is 6 tiles wide by 3 tiles high. Each tile spans `60 / 2^zoom` degrees in each direction. `wmajt.js` uses the same degree-based tile bounds, which is why its GeoJSON can be drawn directly into a 128 px tile canvas. Longitude wraps; latitude does not.

WIWOSM geometry is received in spherical Mercator meters, converted to WGS84 degrees, and then drawn through the equirectangular map conversion. This is valid as a conversion pipeline, but naming and comments should make the distinction explicit.

Important invariants are currently implicit:

- Raster, label, and JSON tile services must all use the 6-by-3 zoom-zero grid.
- A tile object's `csx/csy/csz` fields identify vector content while `lx/ly/lz` identify label content.
- `wma_zoomsize[z]` is the world height in tiles, while twice that value is its width.
- High-zoom vector rendering is enabled for Earth tileset index 0 only, at zooms greater than 12.
- Building thresholds are inconsistent: the overlay is shown at zoom 14, WebGL can render there, but 2D visible-building tracking requires a zoom greater than 14.

These rules should become named projection/tile-grid APIs and shared constants rather than duplicated arithmetic.

## Module design

### `wmacore.js`

Public surface:

- `parseParams(url)`
- `isRTL(lang)`
- `wikiminiatlasInstall(widget, urlParams)`
- `wmaMenu`
- configuration globals such as `wma_imgbase`, `wma_database`, and `wma_tilesets`

`wikiminiatlasInstall` is the effective application object, but it exposes no returned API. Its closure holds viewport position, zoom, selected tileset, marker state, tile objects, language state, and overlay state. Setup constructs the entire widget as an HTML string, attaches document/window handlers, initializes the tile pool, selects a tileset, and starts data loading.

The central render coordinator is `moveWikiMiniAtlasMapTo()`:

1. Normalize the viewport origin and update the scale bar.
2. Reposition each reusable tile div.
3. Choose raster image rendering or `wmajt.update()` for every visible tile.
4. Load or reuse labels and place them as links/spans over each tile.
5. Reposition primary and extra markers.
6. Render buildings and redraw KML/article overlays.

The DOM tile pool is sized to the viewport plus a one-tile margin. Tile DOM nodes are recycled by modular index arithmetic instead of being destroyed and recreated while panning. This is a sound optimization, though network operations need a generation/request identity so late responses cannot do unnecessary work on a recycled tile.

Other responsibilities in this file include:

- tileset and planetary-body configuration;
- zoom, drag, keyboard, touch, fullscreen, and resize behavior;
- label cache and high-zoom label selection;
- article and size-comparison geometry;
- Commons thumbnails and article synopsis UI;
- WebGL/2D building-overlay setup;
- parent-frame messaging; and
- dropdown-menu implementation.

This concentration of responsibilities is the main maintainability constraint.

### `wmajt.js`

Public surface (the returned `wmajt` singleton):

- `update(x, y, z, tile, purge)`
- `detectPointer(event, tile)`
- `ref_z()` and `zbuild()` for the 2D building fallback
- `registerWebGLBuildingData(triangleCount, gl, program)`
- `renderWebGLBuildingData()`
- `setUILang(language)`

The expected JSON tile contract is approximately:

```js
{
  x: Number,
  y: Number,
  z: Number,
  v: Number,
  data: [{ tags: Object, geo: GeoJSONGeometry }],
  idx: { tagName: [featureIndex] }, // optional for older responses
  f: Object                       // accepted but currently unused
}
```

`gotData()` stores responses in a module-level cache. For older responses it creates a tag-to-feature index. It also propagates buildings from detailed tiles into cached ancestors so a parent fallback can still show building detail.

`update()` first searches the requested tile and then its ancestors down to zoom 12. If it finds cached data, it renders with Canvas 2D; otherwise it requests `/tiles/jsontile.php`. Styling is a hard-coded ordered rule list keyed by GeoJSON type, tag, and tag value. A rule batches all matching features into one canvas path, then applies one or more fill/stroke operations.

The same pass tracks visible buildings or permanently adds newly seen building geometry to WebGL arrays. Height tags are parsed, walls and roofs are generated, and complex roofs are triangulated with Poly2Tri. The building renderer supports basic flat, pyramidal, and limited gabled shapes.

Notable rendering limitations:

- Polygon interior rings are ignored by `processShape`, so holes are filled.
- OSM `layer`, bridge, and tunnel ordering is not implemented even though layers are collected.
- Coastline handling is approximated by painting every vector tile blue first.
- Pointer detection checks vertices, not segment distance or polygon containment, and has no maximum hit radius. A click can select a distant named feature in the same tile.
- Style data is code rather than a validated external schema, and includes likely data issues such as `forrest`.
- Geometry is mutated in place to enforce winding, so cached server data is not immutable.
- Invalid/duplicate geometry points can produce division by zero during dash or normal calculations.

### `wmaglobe3d.js`

Public surface:

```js
var globe = wmaGlobe3d(canvas, textureCanvas);
globe.setLatLon(latitude, longitude);
globe.updateTexture();
globe.draw();
```

The factory creates a 30-by-30 UV sphere, uploads the supplied 2D canvas as a texture, and uses glMatrix to rotate the sphere toward a target latitude/longitude. `setLatLon` starts a request-animation-frame easing loop. `wmacore.js` builds the texture by stitching 18 zoom-zero tiles into an intermediate canvas; article geometry can be blended over that texture.

The component is intentionally small and encapsulates most of its state well. Its external contracts are nevertheless implicit: shader elements must have fixed IDs, glMatrix and jQuery must already exist, the source canvas must remain WebGL-readable, and `utils.js` must have installed `requestAnimFrame`.

Current gaps include use of only the legacy `experimental-webgl` context name, disabled shader compile diagnostics, no WebGL context-loss handling, no resource disposal, and no tile-load error path. The globe waits for exactly 18 successful images, so one failed tile prevents initialization. Overlapping tileset loads are not cancelled and can mix stale images.

## State ownership and coupling

There are four distinct kinds of mutable state:

| State | Current owner | Lifetime |
| --- | --- | --- |
| viewport, zoom, tiles, labels, overlays | `wikiminiatlasInstall` closure | page lifetime |
| vector cache, style, building geometry | `wmajt` singleton | page lifetime |
| globe GL objects and animation targets | each `wmaGlobe3d` closure | page lifetime; no disposal |
| building canvas, credit element, flags, caches | top-level globals | page lifetime |

The closure in `wikiminiatlasInstall` suggests instance isolation, but global DOM IDs, global selectors, top-level `bldg3d`/`credit`, the `wmajt` singleton, and document-wide event handlers make the practical limit one widget per page. Calling the installer twice would cause cross-instance state and selector collisions.

There is no teardown path. Event handlers, timers, AJAX callbacks, GPU buffers, and caches remain live until navigation.

Several accidental globals demonstrate the dependence on sloppy mode:

- `me` in the first tileset URL function (`wmacore.js:31`);
- `r` in WebGL building setup (`wmacore.js:1569`);
- `glArrList`, `r`, and `area` in `wmajt.js`;
- multiple loop variables, including `j` in `processSizeOverlay`;
- `wmajt.js` also relies in places on the global `i` declared by `wmacore.js`.

Enabling strict mode or converting one file to an ES module without first fixing these declarations will break execution.

## External interfaces

### HTTP/data dependencies

- Raster basemap URLs from `wma_tilesets`.
- `label.php` responses containing label JSON (with an HTML fallback path).
- `/tiles/jsontile.php` responses matching the vector contract above.
- WIWOSM GeoJSON for article and size-comparison outlines.
- Wikipedia REST page summaries.
- Wikimedia Commons thumbnails and file pages.

URLs are constructed with string concatenation. Language, article, filename, and query values are not consistently passed through `encodeURIComponent`. Transport code has no common timeout, retry, cancellation, validation, or error-reporting policy.

### Parent-frame messaging

Accepted messages can add markers and geometry, request viewport coordinates, or move/zoom the map. The contract is inferred from property presence rather than a versioned message type:

```js
{ coords: [{ lat, lon, title }] }
{ ways, areas, minlon, maxlon }
{ getcoords: requestId }
{ moveto: { lat, lon, zoom } }
```

Responses contain `{ query, response: { topleft, rightbottom } }`. Marker hover/click sends comma-delimited strings such as `"highlight, 2"` instead of JSON. The protocol should be documented, versioned, schema-validated, and restricted to an expected parent origin.

## Defects and shortcomings

### Correctness and resilience

- `latNorm` is undefined for size-overlay line strings. This is an immediate runtime failure.
- `processGeoJSON` tests `maxlon` twice where it appears to intend `maxlon` and `minlon` (`wmacore.js:2353`).
- WIWOSM auto-fit uses longitude bounds as truthy values, so a valid bound equal to zero can suppress fitting (`wmacore.js:2445`).
- The building normal array is omitted when a triangle batch crosses a GPU-array boundary.
- The 2D building timer handle is not assigned, defeating cancellation and allowing duplicate refresh chains.
- Raster tile image errors retry forever every second with cache-busting URLs and no backoff.
- Vector requests have no error callback, request de-duplication, timeout, or cancellation.
- Globe tile loads have no error completion and no generation guard when changing layers quickly.
- Shader compilation is either unchecked or diagnostics are commented out. Link status alone gives poor failure information.
- Coordinate and zoom parameters are weakly parsed and not consistently bounded; `parseParams` neither decodes values nor preserves values containing `=`.
- Polygon holes, feature layer ordering, and several roof cases are knowingly incomplete.
- `shapeGabled` advertises a hipped/hilted parameter but does not implement it.

### Performance and resource use

- The label cache (`lc`) and vector cache (`cache`) never evict entries.
- `zbuild` retains building objects indefinitely.
- In WebGL mode, each unique building encountered is appended permanently to CPU arrays and GPU buffers. Every building buffer accumulated during the session is submitted on every building redraw, even if far outside the viewport.
- Panning calls the full coordinator synchronously for every mouse/touch move. It can reposition all tiles, trigger overlay draws, rebuild labels, and redraw buildings more often than the display refresh rate.
- Each style rule scans its indexed feature list and builds a combined canvas path. This is reasonable for small tiles but lacks profiling guards or feature budgets for pathological responses.
- Globe texture updates re-upload the entire stitched canvas.
- There is no centralized request scheduler, concurrency limit, or viewport prefetch policy.

### Security and trust boundaries

- `wmaReceiveMessage` does not validate `event.origin` or `event.source`. Any window able to message the iframe can command it or supply arbitrarily large geometry.
- `JSON.parse(e.data)` is not protected, so an unrelated or malformed message can throw from the event handler.
- Outgoing request and marker messages use wildcard origins.
- Label-request parse failures are inserted with `.html(data)`. Server and REST `extract_html` are treated as trusted HTML without an explicit sanitization boundary.
- Several values are interpolated into HTML strings or URLs. Repository-owned i18n HTML may be intentionally trusted, but URL-supplied page values and remote response values should not share that path.
- Global suppression of the context menu and broad document handlers affect the whole embedding document, not just the widget.

### Maintainability and deployment

- `wmacore.js` mixes application state, projection math, UI construction, rendering, network access, and integrations in one 2,600-line function/file.
- File-level globals and singleton state prevent multiple independent widgets.
- Numeric thresholds, tile size, coordinate formulas, URLs, and tileset-index checks are duplicated.
- Production and `_dev` source copies can drift; `wmajt.js` and `wmajt_dev.js` already differ in style ordering.
- Minified artifacts are committed and generated with YUI Compressor, but there is no manifest, locked tool version, source map, or stale-artifact check.
- `medians.js` is required by `wikiminiatlas_extern.php` but missing from version control.
- The repository has no automated unit, browser, contract, lint, or render-regression tests and no evident CI definition.
- The public/runtime contracts for label tiles, JSON tiles, shader IDs, and parent messages are not documented elsewhere.
- Mixed old and newer JavaScript styles obscure the actual browser target. Deprecated jQuery event/AJAX shorthands tie the code to older jQuery behavior.

### User experience and accessibility

- Most controls are clickable `<div>` or `<img>` elements without button semantics, focus behavior, or ARIA labels.
- Keyboard handlers are document-wide and use numeric key codes; they can interfere with selects or other controls.
- Pinch zoom and wheel zoom are absent, while document touch movement and context menus are broadly suppressed.
- Network and rendering failures generally disappear silently; retries and loading indicators have no terminal error state.
- Motion easing does not honor reduced-motion preferences.
- The globe and canvases have no accessible textual alternative.

## Recommended target design

Modernization should preserve the existing service contracts initially and put boundaries around them before replacing rendering technology.

```text
WikiMiniAtlasApp
  |-- Config + validated initial parameters
  |-- ViewState (center, zoom, body, layer, language)
  |-- Projection / TileGrid
  |-- TileManager
  |     |-- RasterSource
  |     |-- LabelSource
  |     `-- VectorSource
  |-- RendererStack
  |     |-- Raster/DOM renderer
  |     |-- Vector canvas renderer
  |     |-- Building renderer (WebGL with 2D fallback)
  |     |-- Geometry overlay renderer
  |     `-- Globe renderer
  |-- UI + input controller
  `-- HostBridge (versioned postMessage protocol)
```

Each component should receive dependencies and configuration explicitly. `WikiMiniAtlasApp.destroy()` should abort requests, remove listeners, cancel animation/timers, release WebGL resources, and clear per-instance caches. A compatibility function named `wikiminiatlasInstall` can construct the new app so embedders do not need an immediate migration.

## Prioritized improvement plan

### Priority 0: stabilize the current implementation

1. Fix `latNorm`, the duplicated `maxlon` check, longitude-zero auto-fit, the normal-buffer overflow copy, and the building timer assignment.
2. Declare every variable, add the actual external globals to lint configuration, and make `no-undef`/`no-redeclare` blocking. Only then enable strict mode.
3. Wrap and validate message parsing; require the configured parent `origin` and `source`; cap coordinate/geometry counts; use typed, versioned JSON responses.
4. Bound raster retries with exponential backoff and a visible terminal state. Add error/timeout paths to all requests.
5. Restore or eliminate the missing `medians.js` dependency and add a clean-checkout boot smoke test.
6. Check shader compile/link status and gracefully select the 2D fallback.

These are localized changes with high reliability value and should precede a broad rewrite.

### Priority 1: control lifetime and resource growth

1. Introduce per-instance state and stop using global DOM selectors/IDs internally.
2. Add an LRU cache with byte/entry budgets for labels and vectors.
3. Track visible building tile ownership. Build/delete GPU buffers per tile (or chunk) rather than maintaining an append-only world buffer.
4. Add request keys, in-flight de-duplication, viewport generations, cancellation, and a modest concurrency limit.
5. Coalesce drag/resize work through `requestAnimationFrame`; separate cheap tile repositioning from expensive data and overlay updates.
6. Add lifecycle disposal for the map and globe.

### Priority 2: separate and validate behavior

1. Extract a tested `Projection`/`TileGrid` module and replace special checks such as `wma_tileset == 0` with tileset capabilities.
2. Extract HTTP clients with explicit response validation and URL construction through `URL`/`URLSearchParams`.
3. Move vector style rules to a declarative, validated definition and implement polygon holes and OSM layer/bridge/tunnel ordering.
4. Replace nearest-vertex picking with bounded segment/polygon hit testing or a per-tile spatial index.
5. Convert incrementally to ES modules while retaining a small global compatibility entry point.
6. Consolidate production/development sources and generate minified, versioned artifacts with source maps in one reproducible build.

### Priority 3: improve interaction and observability

1. Use semantic buttons, focus styles, ARIA state, scoped keyboard handling, and accessible alternatives for canvas content.
2. Add wheel/pinch input and reduced-motion support without suppressing document-wide browser behavior.
3. Surface load and render failures, and collect lightweight timing/cache/request metrics to guide optimization.
4. Consider WebGL2 only after context handling, buffer lifetime, and fallbacks are correct; it is not the first-order need.

## Test strategy

A practical test pyramid can be added without first rewriting the application:

- **Unit tests:** coordinate round trips and wrapping; tile URL generation; parameter parsing; height parsing; cache keys; geometry winding; buffer-boundary writes; overlay extent calculations.
- **Contract tests:** fixture responses for `label.php` and `jsontile.php`; old and new index versions; malformed/oversized responses; a versioned host-message schema.
- **Canvas tests:** render fixed GeoJSON fixtures and compare targeted pixels or small golden images, especially holes, style order, and dashed lines.
- **Browser integration tests:** clean boot, drag, zoom, layer/body switch, label switch, failed tile behavior, KML/size overlays, resize, and teardown/reinstall.
- **WebGL tests:** shader failure fallback, context loss/restoration, more than 5,000 triangles, and bounded GPU-buffer counts after long pans.
- **Security tests:** wrong-origin and malformed messages, unsafe URL values, untrusted HTML responses, and geometry/request size limits.

The first smoke test should load `iframe.html` from a clean checkout and assert that no required file is missing and no uncaught error occurs. That single test would catch several current deployment and runtime gaps.

## Suggested acceptance metrics

The modernization effort will be easier to manage with explicit outcomes:

- no uncaught exceptions during the browser integration suite;
- zero undeclared variables under strict linting;
- bounded label/vector cache sizes after a long pan;
- bounded GPU buffers proportional to visible/prefetched tiles, not session travel;
- no network retry after the configured attempt limit;
- all cross-window commands rejected unless source, origin, version, and schema match;
- one public app instance can be destroyed and recreated without duplicate handlers; and
- two widgets can coexist without state or DOM collisions.


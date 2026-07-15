# Tiled globe prototype

This directory contains the first vertical slice of the WikiMiniAtlas globe overhaul. It deliberately runs alongside the legacy application rather than changing its entry point.

Implemented so far:

- the exact 6-by-3 zoom-zero plate carrée grid used by WikiMiniAtlas;
- conversion between render rows and the label service's south-to-north rows;
- raster tiles rendered as independently textured spherical patches;
- hierarchical horizon/frustum culling and budgeted front-surface tile selection;
- progressive parent-tile fallback while detailed imagery loads;
- bounded texture memory, metadata, and concurrent image requests;
- one-finger orbit, two-finger pan/pinch, and wheel zoom controls; and
- a shared procedural placeholder before any ancestor imagery is available.

Run a static server from the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/globe/`.

By default the demo requests the existing relative `tiles/mapnik` hierarchy. A different compatible tile base and maximum prototype zoom can be supplied without changing code:

```text
http://localhost:8000/globe/?tileBase=https://example.org/tiles&maxZoom=15
```

For camera-range testing, the initial center distance can also be specified;
`1.01` is close to the surface and `20` shows a distant planet:

```text
http://localhost:8000/globe/?distance=1.01
```

The tile base must permit WebGL texture use from the demo origin when it is cross-origin. Failed requests retain the nearest loaded parent image, or a shared neutral placeholder if no ancestor is available, making the geometry and level-of-detail behavior testable without a complete tile checkout.

Run the coordinate tests with:

```sh
node --test globe/*.test.mjs
```

The default maximum tile level is 15 and can be raised to 20 through `maxZoom`.
Wheel zoom scales altitude above the surface from 0.0005 to 50 planet radii;
pointer sensitivity decreases with the visible surface footprint at close range.
On touch screens, moving two fingers apart zooms in, moving them together zooms
out, and moving their midpoint orbits the globe.

The renderer enforces a 256-visible-patch ceiling. It keeps at most 384 raster
textures or 32 MiB of estimated RGBA texture data, whichever limit is reached
first, and performs at most 12 image requests at once. During pointer and wheel
gestures, new detail requests pause for 120 ms; already loaded imagery remains
visible. High-detail patches use a reduced shared mesh because their curvature is
negligible at screen scale.

The next slice will add label candidate loading and globe-to-screen projection
while keeping the labels as accessible HTML links.

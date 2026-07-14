# Tiled globe prototype

This directory contains the first vertical slice of the WikiMiniAtlas globe overhaul. It deliberately runs alongside the legacy application rather than changing its entry point.

Implemented so far:

- the exact 6-by-3 zoom-zero plate carrée grid used by WikiMiniAtlas;
- conversion between render rows and the label service's south-to-north rows;
- raster tiles rendered as independently textured spherical patches;
- horizon culling and camera-distance-based tile zoom selection;
- pointer orbit and wheel zoom controls; and
- procedural placeholders when raster tiles are unavailable.

Run a static server from the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/globe/`.

By default the demo requests the existing relative `tiles/mapnik` hierarchy. A different compatible tile base and maximum prototype zoom can be supplied without changing code:

```text
http://localhost:8000/globe/?tileBase=https://example.org/tiles&maxZoom=3
```

The tile base must permit WebGL texture use from the demo origin when it is cross-origin. Failed requests retain a coordinate-labelled placeholder, making the geometry and level-of-detail behavior testable without a complete tile checkout.

Run the coordinate tests with:

```sh
node --test globe/plate-carree-grid.test.mjs
```

The next slice will add label candidate loading and globe-to-screen projection while keeping the labels as accessible HTML links.


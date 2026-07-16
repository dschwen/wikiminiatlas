# Tiled globe prototype

This directory contains the first vertical slice of the WikiMiniAtlas globe overhaul. It deliberately runs alongside the legacy application rather than changing its entry point.

Implemented so far:

- the exact 6-by-3 zoom-zero plate carrée grid used by WikiMiniAtlas;
- conversion between render rows and the label service's south-to-north rows;
- raster tiles rendered as independently textured spherical patches;
- hierarchical horizon/frustum culling and budgeted front-surface tile selection;
- progressive parent-tile fallback while detailed imagery loads;
- bounded texture memory, metadata, and concurrent image requests;
- batched legacy label loading with globe projection and horizon culling;
- legacy label symbol styling, weight-ordered collision filtering, and accessible Wikipedia links;
- a compact legacy-style menu for celestial body, body-specific tile set, and label language;
- all legacy Earth, Moon, Mars, Venus, Mercury, Io, and Titan imagery and label datasets;
- the legacy 18-pixel zoom, recenter, fullscreen, and settings button layout;
- independent metric and imperial scale bars based on center-frame surface resolution;
- one-finger orbit, two-finger pan/pinch, and wheel zoom controls, including gestures that begin on labels;
- a realistic popup-sized iframe host page; and
- a shared procedural placeholder before any ancestor imagery is available.

Run a static server from the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/globe/`.

For the intended embedded presentation, open
`http://localhost:8000/globe/landing.html`. It hosts the same viewer in a
responsive 680-by-440-pixel popup frame. Query parameters on the landing page
are forwarded to both the frame and its full-window link.

By default the demo requests the existing relative `tiles/mapnik` hierarchy. A different compatible tile base and maximum prototype zoom can be supplied without changing code:

```text
http://localhost:8000/globe/?tileBase=https://example.org/tiles&maxZoom=15
```

The 18-by-18-pixel settings button follows the legacy 2D widget and opens a
compact menu. Its body selector switches between Earth, Moon, Mars, Venus,
Mercury, Io, and Titan without moving the camera. The map selector is populated
with the layers available for that body; Earth has six layers and the Moon has
two. The selection is reflected in the `globe` and `tileSet` query parameters,
for example `?globe=moon&tileSet=satellite`.

Each body definition carries over the 2D map's label dataset, equatorial
circumference, maximum zoom, label contrast, attribution, filename convention,
and longitude offset. The Moon, Mars, Mercury, and Io sources that use shifted
imagery apply their legacy 180-degree column transform before requesting tiles.
Mercury also retains its zoom- and column-dependent directory hierarchy.

The remaining controls occupy the same coordinates and sprite cells as the 2D
map: zoom in/out and recenter are stacked at the upper left, while fullscreen
and settings sit at the upper right. Each zoom-button step halves or doubles
camera altitude, corresponding to one level of center-surface raster detail.
The recenter target defaults to `35,-112` and can be set with `lat` and `lon`:

```text
http://localhost:8000/globe/?lat=43.615&lon=-116.2023
```

Labels use `../label.php`, English Wikipedia, and the Earth dataset by default.
These settings can be changed independently, or labels can be disabled:

```text
http://localhost:8000/globe/?labelBase=https://example.org/label.php&labelLang=de&globe=earth
http://localhost:8000/globe/?labels=0
```

`labelLang` is intentionally distinct from legacy `lang`: existing 2D iframe
URLs use `lang` for the host article/WIWOSM language and carry the label
language in the `wma` coordinate payload.

The label selector can change languages or disable labels without reloading the
viewer. Changing the celestial body replaces the tile source and the `g`
dataset sent to `label.php` together. All selectors update the iframe URL, so a
non-BFCache Back navigation can restore the same display choices along with the
camera state.

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
The pointer gesture surface includes projected label links. A clean label tap
still follows the link, while motion beyond the drag threshold or participation
in a pinch suppresses that navigation and controls the globe instead.
Label hover inverts the configured foreground/glow contrast without drawing a
background box. Holding Ctrl (or Command on macOS) while hovering a Wikipedia
label opens a cached article-summary preview; obsolete summary requests are
aborted when the hovered article changes.

The scale occupies the 2D map's lower-left position. It uses the angular ground
resolution at the center of the rendered sphere, where distortion is lowest,
and multiplies it by the selected body's equatorial radius. Kilometre and mile
rows independently select the largest 1/2/5 × 10ⁿ distance that fits within
50 CSS pixels, so both remain useful rather than displaying a converted value
with an awkward bar length. Metric values below one kilometre are shown in
metres. The calculation is isolated in `scale-bar.mjs` so a future unit setting
can hide either row without changing renderer math.

The globe accepts the `wma=lat_lon_width_height_site_zoom_uiLanguage` payload
emitted by `wikiminiatlas.js`, including its optional center latitude/longitude
suffix and the older unnamed coordinate-query form. Legacy numeric zoom is
converted to camera altitude by matching the 2D map's center angular resolution.
The remaining contracts required before replacing `iframe.html` are tracked in
`docs/3D_GLOBE_PLAN.md`, including markers, WIWOSM overlays, host messaging,
Commons previews, and UI localization.

The renderer enforces a 256-visible-patch ceiling. It keeps at most 384 raster
textures or 32 MiB of estimated RGBA texture data, whichever limit is reached
first, and performs at most 12 image requests at once. During pointer and wheel
gestures, new detail requests pause for 120 ms; already loaded imagery remains
visible. High-detail patches use a reduced shared mesh because their curvature is
negligible at screen scale.

Label requests preserve the existing plate carrée boxes and the label service's
south-to-north row numbering. Up to ten boxes at the same zoom are combined in
one range request, with four requests active at once and 256 label tiles cached.
The overlay displays at most 80 labels, prefers higher-weight candidates, reuses
stable DOM nodes, and removes candidates behind the geometric horizon. During
camera gestures it retains and reprojects the last coherent candidate snapshot;
replacement tile batches are swapped in together only after they settle. Older
label responses remain supported by reconstructing latitude/longitude from their
tile-local coordinates.

Navigating through a label and returning with the browser Back action preserves
the live WebGL and label resources when the page enters the back/forward cache.
The current latitude, longitude, and camera distance are also stored in the
page's history entry so browsers that reload instead of caching restore the same
view.

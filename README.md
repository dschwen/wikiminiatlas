WikiMiniAtlas
=============

This repo contains the client-facing scripts and data for the WikiMiniAtlas map plugin in Wikipedia.
WikiMiniAtlas will display maps of Earth, Moon, Venus, Mars, Mercury, Titan and Io, and on those maps
clickable links to Wikipedia articles.

Features include:

* 3D buildings
* Map data by OpenStreetMap
* Outline overlays
* Size comparison overlays
* Article summary display

Visit http://meta.wikimedia.org/wiki/WikiMiniAtlas for documentation and licensing details.

Developer documentation: [client design and technical assessment](docs/DESIGN.md).

Globe overhaul: [implementation plan](docs/3D_GLOBE_PLAN.md) and [prototype](globe/README.md).

## Globe production build

Install the pinned build dependency and generate the deployable globe assets:

```sh
npm ci
npm run build:globe
```

The build bundles the globe modules and Poly2Tri into
`min/wma-globe.min.js`, minifies `globe/globe.css` into
`min/wma-globe.min.css`, and emits source maps for both. The legacy
`min/wmaglobe3d.min.js` overview component is a separate program and remains
unchanged. `make globe` invokes the same production build after dependencies
have been installed.

The root `index.html` and the deployed Wikipedia endpoint `iframe.html` are
production 3D globe entries that load these two generated assets.
`globe/index.html` remains the unbundled development entry.

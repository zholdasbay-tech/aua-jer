# Aua Jer

NISAR surface-change explorer. Built by team Edviller (Astana, Kazakhstan) for the NASA Space Apps Challenge 2026, challenge "Dancing with the SARs".

Live app: https://nasa.altynkhan.com/ (also published to GitHub Pages by the workflow in `.github/workflows`)

Demo slides (7 pages): [Aua_Jer_demo.pdf](Aua_Jer_demo.pdf)

*Aua* is Kazakh for air and *Jer* for ground. The app compares two NISAR L-band radar passes over any place on Earth, maps what changed on the ground, and shows NASA POWER weather for the same point so you can look for a reason.

## What it does

The panel walks through five numbered steps; each lights up as you complete it.

1. **Where to look.** Type a town or region (OpenStreetMap Nominatim), or coordinates, or pick an example, or use the map centre or your own location. The public NISAR archive is searched through the ASF Search API and the passes are grouped by orbit track and frame, so only passes with the same viewing geometry are compared. The track is described in words: "Track 127, frame 27 · northbound · 10 passes, about every 12 days".
2. **Pick two passes to compare.** Before (A) and After (B) from the selects, or drag the A and B handles on the timeline; hovering a pass shows its date and a thumbnail. Four views: one pass, a swipe divider, a blink that flicks between A and B, and the change map. Play animates through every pass at three speeds.
3. **What changed.** Per-pixel difference of the HH, HV or combined echo between A and B, after aligning the two passes to the nearest pixel and removing the scene-wide median shift. Reports how much area got brighter or darker and lists the six strongest 8 km blocks as "17 km NE of Astana"; hovering one highlights it on the map, clicking flies there and reads its history.
4. **Ask about a spot.** Click the map (or right-click → "Ask about this spot"). You get the place name, a Before / After / Change table for HH and HV, that spot's echo in every pass with NASA POWER daily temperature and rain underneath, and a plain-language reading with a cause badge such as "Likely frozen ground" or "Surface itself changed". Downloads as CSV.
5. **Sources on screen.** The exact NISAR granules on screen with links to the browse image and the full HDF5 product.

Also: a live readout of HH, HV and change under the mouse; a right-click or long-press menu on the map (ask, search here, zoom, copy coordinates); every view has a link you can copy; base map, sensitivity and play speed are remembered between visits.

Keyboard: `1` `2` `3` `4` switch the view; `←` `→` step pass B, with `Shift` step pass A; `Space` plays; `F` fits the footprint; `+` `−` zoom; `Esc` clears the point; `?` lists everything.

## Data

| Source | Used for |
| --- | --- |
| NISAR L2 GCOV browse images, NASA/ISRO, via ASF DAAC | Radar imagery (HH and HV) |
| ASF Search API | Finding passes and footprints |
| NASA POWER daily API (MERRA-2, GEOS) | Air temperature and rain at the clicked point |
| OpenStreetMap Nominatim | Place-name search and the name of a clicked spot |
| NASA GIBS (Black Marble, Blue Marble) | Base maps |
| OpenStreetMap | Optional base map |

## Limits

- Browse images are about 200 m per pixel and 8-bit, scaled for display. Results are relative differences, not calibrated backscatter in dB.
- A change on the map can have several causes. The weather chart is a hint, not proof.
- NASA POWER is a model grid, not a weather station.
- Next step: read the full-resolution GCOV HDF5 products for calibrated gamma-nought, and add ground readings from the Aua phone-barometer network.

## Run it

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

No server code: the built site is static files that call the public NASA, ASF and OpenStreetMap APIs from the browser.

## How the code is organised

React 19 + Vite, with one [zustand](https://github.com/pmndrs/zustand) store. Plain CSS modules.

```
src/
  lib/          pure logic, no React: Mercator maths, ASF search, scene resampling,
                change detection, hotspots, NASA POWER, geocoding, the insight rules
  store/        useStore.js — all application state and actions (search, load, compare, inspect, play, view)
  components/
    Map/        canvas renderer, pointer interactions, overlays (tags, swipe, tools, layers, legend, HUD, menu)
    Panel/      the five steps, timeline, chart, help sections
    Hero/       landing screen with the particle field
    TopBar/ StatusBar/ Overlays/ icons/
  hooks/        keyboard shortcuts, clock
  styles/       tokens and base styles
deploy/         nginx config and deploy script for the server
```

## Deploy

- **Server:** `deploy/deploy.sh` builds, uploads `dist/` to `/var/www/nasa` on the host, installs the nginx site for `nasa.altynkhan.com` and requests a Let's Encrypt certificate once the DNS A record points at the server.
- **GitHub Pages:** `.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/`. Set the repository's Pages source to "GitHub Actions" once.

## Use of AI

An AI assistant (Claude, by Anthropic) wrote most of the application code and helped draft the interface text, this README and the demo slides. The team member chose the challenge and the Aua concept, set the design direction and reviewed the results. All maps and charts in the slides are screenshots of the running app on NASA data. No AI-generated images, audio or video are used, and no NASA logos or mission identifiers.

## Licence

MIT. Not affiliated with or endorsed by NASA.

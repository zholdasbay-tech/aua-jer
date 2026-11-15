# Aua Jer

NISAR surface-change explorer. Built by team Edviller (Astana, Kazakhstan) for the NASA Space Apps Challenge 2026, challenge "Dancing with the SARs".

Live app: https://zholdasbay-tech.github.io/aua-jer/

Demo slides (7 pages): [Aua_Jer_demo.pdf](Aua_Jer_demo.pdf)

*Aua* is Kazakh for air and *Jer* for ground. The app compares two NISAR L-band radar passes over any place on Earth, maps what changed on the ground, and shows NASA POWER weather for the same point so you can look for a reason.

## What it does

- Searches the public NISAR archive for any coordinates (ASF Search API) and groups the passes by track and frame, so only passes with the same viewing geometry are compared.
- Shows each pass on a map: single pass, a swipe between pass A and pass B, an animation through all passes, or a change map.
- Change map: per-pixel difference of the HH, HV or combined echo between A and B, after aligning the two passes to the nearest pixel and removing the scene-wide median shift. Reports how much area got brighter or darker and lists the six strongest 8 km blocks.
- Ask a point: click the map to get that spot's echo in every pass (relative to each scene's median), with NASA POWER daily temperature and rain underneath. Downloads as CSV.
- Every view has a link you can share. Provenance lists the exact NISAR granules on screen.
- Keyboard: 1, 2, 3 switch the view; left and right arrows step pass B; Space plays all passes; F fits the footprint; + and − zoom.

## Data

| Source | Used for |
| --- | --- |
| NISAR L2 GCOV browse images, NASA/ISRO, via ASF DAAC | Radar imagery (HH and HV) |
| ASF Search API | Finding passes and footprints |
| NASA POWER daily API (MERRA-2, GEOS) | Air temperature and rain at the clicked point |
| NASA GIBS (Black Marble, Blue Marble) | Base maps |
| OpenStreetMap | Optional base map |

## Limits

- Browse images are about 200 m per pixel and 8-bit, scaled for display. Results are relative differences, not calibrated backscatter in dB.
- A change on the map can have several causes. The weather chart is a hint, not proof.
- NASA POWER is a model grid, not a weather station.
- Next step: read the full-resolution GCOV HDF5 products for calibrated gamma-nought, and add ground readings from the Aua phone-barometer network.

## Run it

It is one static file, `index.html`, with no build step and no server code. Open the live link, or serve the folder with any static web server.

## Use of AI

An AI assistant (Claude, by Anthropic) wrote most of the application code and helped draft the interface text, this README and the demo slides. The team member chose the challenge and the Aua concept, set the design direction and reviewed the results. All maps and charts in the slides are screenshots of the running app on NASA data. No AI-generated images, audio or video are used, and no NASA logos or mission identifiers.

## Licence

MIT. Not affiliated with or endorsed by NASA.

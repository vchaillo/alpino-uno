# Calpino Uno

A responsive, French-language Formula 1 explorer for every season from 1950 to the current year. Independent fan project, not affiliated with Formula 1.

## Features

- Season calendar, circuit locations and race winners.
- Driver and constructor championships with proportional points bars.
- Race results, grid positions, laps, finishing status, qualifying and sprint results.
- Search and filters; favorites, watched races and watchlist across seasons.
- Versioned localStorage collection, isolated behind a persistence adapter for a future Firebase migration.
- Ten-minute session cache, request deduplication, race-condition protection and explicit error/retry states.

## Data

[Jolpica F1](https://github.com/jolpica/jolpica-f1) provides the Ergast-compatible API. Data completeness varies by season and session. Results appear when published by the API; this is not a live timing app. Browser requests use the browser-managed User-Agent. No API key or backend required.

## Development

Serve this folder with any static HTTP server, for example `python3 -m http.server 8000`. No build dependencies. Validate JavaScript with `node --check app.js`.

## Deployment

The GitHub Actions workflow deploys public files to GitHub Pages on every push to `main`. Select **GitHub Actions** as the Pages source in repository settings.

Personal lists are stored on the current browser/device and are not yet synchronized through Firebase.

## Career statistics

The Statistics tab uses a compact snapshot adapted from [F1DB](https://github.com/f1db/f1db), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution, source version and latest completed race date appear in the UI. The deployment regenerates the snapshot from the latest F1DB release on each push and daily. No additional data license restrictions are introduced by this adaptation.

Records: world titles, Grand Prix wins, poles (not merely grid position), sprint wins, podiums, fastest laps, race starts, completed laps, grand slams and win percentage (minimum 20 starts for records). Driver profiles include season-by-season statistics. Laps led are unavailable in this source and explicitly marked; completed laps are not presented as laps led. Raw points and win rates need era context.

Run `python3 scripts/refresh-statistics.py` to refresh the local snapshot.

## Account preview

The header's Profile link opens a demo profile with editable name, email and favorite team stored locally. Recent connections represent actual visits on this browser, not authenticated sessions. Password reset is a labeled simulation and sends no email. No authentication, password storage or server-side account changes are implemented.

## Hero instrument

The hero uses an AI-generated transparent industrial side-profile car drawing, combined with a native SVG dial and HTML year digits. The odometer animation works for both season arrows and the select control, cancels interrupted rolls, and respects reduced-motion settings. The SVG needle follows the selected season's position within the archive range. It is a decorative season gauge, not a speed measurement.

## Cockpit navigation

A single detailed SVG cockpit uses mechanical controls, carbon hatching, a halo, fasteners and industrial annotations. The wheel display selects archive seasons rather than showing real telemetry. Click its screen for the searchable year picker, use the paddles for one-year changes, or scroll over the screen (up = next season, down = previous season). Wheel capture is local to the screen and rate-limited for trackpads. LEDs, rotary controls and screen highlights animate with the odometer and respect reduced motion. Mobile navigation remains below the season summary.

## Tables and session availability

All rendered tables offer keyboard-accessible column buttons with ascending/descending sorting and aria-sort indicators. Numbers, qualifying times and text are compared appropriately; unavailable values stay last and existing row actions remain attached. Sprint stays disabled until published SprintResults are found for that race, and is disabled for pre-2021 seasons. Yellow SVG trophies identify race/sprint winners and completed-season champions. Interface surfaces use square corners while team markers and mechanical drawings remain circular.

## Circuit archive

Circuit profiles cover 78 circuits and 160 historical layouts using F1DB race metadata and SVG outlines by Jules Roy / F1DB (CC BY 4.0). The outline is selected by the race season and round; directory cards show the newest layout. Outlines are adapted to a consistent red contour style. Dates and length/turn counts follow each selected layout. Race counts and winner records include completed World Championship Grands Prix since 1950, excluding sprints and canceled events. Shared-car winners remain individually attributed.

Circuit opening dates are shown only where verified from the circuit's official history (Silverstone, Monza, Spa); other profiles explicitly distinguish the first F1 event from the site's creation date. Statistics and drawings refresh in deployment along with the career snapshot.

## Annual calendar and flags

The Calendar tab shows all twelve months, Monday-first, with race dates and accessible links opening race details. It follows the selected season and supports existing search/filters. Calendar placement uses each published race date. Country flags use bundled flag-icons SVG assets (MIT) rather than emoji fonts. Legacy storage keys are preserved so existing personal data remains available on the same GitHub Pages origin after the repository rename.

## Layouts, loading and circuit world map

Grand Prix, collection and circuit directory views offer gallery/list buttons with independent local preferences. Lists preserve race actions and circuit profiles, and reuse accessible table sorting. Season changes keep the previous card/row geometry as neutral placeholders until the matching request generation finishes; placeholder results are inert and hidden from assistive technology while the status announces loading. Independent collection, statistics and circuit views remain usable.

The circuit directory begins with an equirectangular SVG world map using real F1DB coordinates. Nearby circuits are clustered; selecting a cluster zooms and lists its members. Map controls, dragging and keyboard arrows move the viewport; points and cluster members open the existing circuit profiles. Search filters both the directory and the map. The bundled world outline is adapted from Natural Earth 1:110m country geometries (public domain): https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson. No external map tiles, API key or map tracking are required.

# Formula One

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

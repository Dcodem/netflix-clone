# Netflix clone

Self-hosted Netflix-style UI for a family catalog API. The app is a thin Vite + React + TypeScript client. It does not include a backend, auth, or database.

Profiles, watch history, and taste recommendations live in `localStorage` on each device.

## Run

The catalog API must already be running at `http://localhost:8090` (`GET /movies`, `GET /search`, `GET /movies/{id}`, `GET /shows/{id}`). Start it with `./run-local.sh` in the API repo if it is not up.

Then:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies API routes (`/movies`, `/shows`, `/search`, `/catalog`, `/health`, `/watch`, `/img`) to `:8090`.

Optional: if `watch_href` values are relative (e.g. `/movies/play/...`), set
`VITE_PLAYER_ORIGIN` to the player site origin so the iframe can load them.

## Screens

- Who's watching — create / rename / delete profiles
- Home — hero, Continue Watching, Top Picks, Trending (by rating), New Releases (by year), genre rows, full poster grid
- Search — debounced header search
- Movie / show detail — metadata, Watch, season tabs and episode Watch actions
- Watch — full-screen iframe of `watch_href` (Back or Escape)

Taste rows are ranked from genres on titles that profile has watched. History does not sync across phones and the TV unless they share a browser.

See [API.md](API.md) and [openapi.json](openapi.json) for the contract.

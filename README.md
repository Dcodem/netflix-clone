# Netflix clone

Self-hosted Netflix-style UI for a family catalog API. The app is a thin Vite + React + TypeScript client. It does not include a backend, auth, or database.

Profiles, watch history, and taste recommendations live in `localStorage` on each device.

## Run

The UI talks to a catalog API at `http://localhost:8090`. Use the real family API if you have it (`./run-local.sh` in that repo). If you do not, this repo includes a large mock catalog (120 movies, 90 shows, seasons, and episode synopses):

```bash
node mock/server.mjs
```

Then:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies API routes (`/movies`, `/shows`, `/search`, `/catalog`, `/health`, `/watch`, `/img`, `/art`) to `:8090`.

Do not run the mock and the real API on 8090 at the same time. Set `MOCK_PORT` if you need the mock on another port.

Optional: if `watch_href` values are relative (e.g. `/movies/play/...`), set
`VITE_PLAYER_ORIGIN` to the player site origin so the iframe can load them.

## Screens

- Who's watching — create / rename / delete profiles
- Home — Netflix-style vertical stack of themed rails (Continue Watching, Top Picks, Because you watched, Trending, New Releases, Popular Movies / TV Shows, genre rows). Header switches Home / Movies / TV Shows.
- Search — debounced header search
- Movie / show detail — metadata, Watch, season tabs and episode Watch actions
- Watch — full-screen iframe of `watch_href` (Back or Escape)

Taste rows are ranked from genres on titles that profile has watched. History does not sync across phones and the TV unless they share a browser.

Movies vs TV shows: the API sets `kind` to `"movie"` or `"show"` on each title. Cards route to `/movie/:id` or `/show/:id`, catalog calls use `/catalog/movies` vs `/catalog/shows`, and series posters get a SERIES badge. Show pages are the only ones with seasons and episodes.

Episode descriptions: the UI prints `episode.synopsis` from `GET /shows/{id}`. The frontend does not look up TVMaze/TMDB itself; if the API leaves synopsis empty, that episode has no description.

See [API.md](API.md) and [openapi.json](openapi.json) for the contract.

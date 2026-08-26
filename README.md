# Netflix clone

Self-hosted Netflix-style UI for a family catalog API. The app is a thin Vite + React + TypeScript client. It does not include a backend or database.

Sign-in, profiles, watch history, likes, and taste recommendations live in `localStorage` on each device. Passwords are hashed with PBKDF2 before they are stored.

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

Optional trailer keys (Account screen, or env):

- `VITE_IVA_API_KEY` — Internet Video Archive / Fabric Origin subscription key. Plex uses IVA for extras and mini trailers.
- `VITE_TMDB_API_KEY` — optional fallback that looks up YouTube trailers when IVA has no match.

## Screens

- Sign in / Sign up — local accounts on this device
- Who's watching — create / rename / delete profiles for the signed-in account
- Home — Netflix-style rails, including Top Picks from the taste profile
- Taste — favorite genres, inferred weights, liked titles
- Account — IVA / TMDB keys for mini trailers
- Search — debounced header search
- Movie / show detail — metadata, Watch, Like, season tabs, episode Watch, trailer preview
- Watch — full-screen iframe of `watch_href` (Back or Escape)

Taste rows are ranked from favorite genres, likes, and titles that profile has watched. History does not sync across phones and the TV unless they share a browser.

Mini trailers play on the hero and title pages. IVA is tried first (short GetVideo clips). If that key is missing or IVA has no match, TMDB YouTube trailers are used. Catalog playback is still only `watch_href`.

Movies vs TV shows: the API sets `kind` to `"movie"` or `"show"` on each title. Cards route to `/movie/:id` or `/show/:id`, catalog calls use `/catalog/movies` vs `/catalog/shows`, and series posters get a SERIES badge. Show pages are the only ones with seasons and episodes.

Episode descriptions: the UI prints `episode.synopsis` from `GET /shows/{id}`. The frontend does not look up TVMaze/TMDB itself; if the API leaves synopsis empty, that episode has no description.

See [API.md](API.md) and [openapi.json](openapi.json) for the contract.

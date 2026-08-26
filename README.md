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

- `VITE_TMDB_API_KEY` — default. Free TMDB key for YouTube trailers on the billboard, hover cards, and title modal.
- `VITE_IVA_API_KEY` — optional paid Fabric Origin / IVA key. Used only when TMDB has no match. Leave this unset.

## Screens

- Sign in / Sign up — local accounts on this device
- Who's watching — large profile tiles and an outlined Manage Profiles control
- Home — billboard hero, silent poster rails, hover previews, Top 10, Continue Watching progress
- Movies / TV Shows — genre dropdown over the billboard
- New & Popular — Top 10 plus new and trending rails
- My List — titles saved on this profile
- Taste — favorite genres, inferred weights, liked titles (account menu)
- Account — IVA / TMDB keys for mini trailers
- Search — expanding header icon, poster grid; cards open a title modal
- Title modal — trailer, Play / My List / thumbs, similar titles, show episodes
- Movie / show detail — still available at `/movie/:id` and `/show/:id`
- Watch — full-screen iframe of `watch_href` (hover for Back, or press Escape)

Rows use silent posters. Hovering a tile opens a jawbone with a muted mini-trailer, Play, My List, thumbs, match %, maturity, and More Info. Clicking a poster opens the title modal instead of leaving Home.

Taste rows are ranked from favorite genres, likes, and titles that profile has watched. History, My List, and likes do not sync across phones and the TV unless they share a browser.

Mini trailers play on the billboard, hover cards, and title modal. They default to TMDB YouTube trailers. IVA / Fabric Origin is optional and only used if that key is present and TMDB has no match. Catalog playback is still only `watch_href`.

Movies vs TV shows: the API sets `kind` to `"movie"` or `"show"` on each title. Catalog calls use `/catalog/movies` vs `/catalog/shows`. Show modals are the ones with seasons and episodes.

Episode descriptions: the UI prints `episode.synopsis` from `GET /shows/{id}`. The frontend does not look up TVMaze/TMDB itself; if the API leaves synopsis empty, that episode has no description.

See [API.md](API.md) and [openapi.json](openapi.json) for the contract.

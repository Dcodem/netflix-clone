# Netflix clone

Self-hosted Netflix-style UI for a family catalog API. The app is a thin Vite + React + TypeScript client. It does not include a backend or database.

Sign-in, profiles, watch history, likes, and taste recommendations live in `localStorage` on each device. Passwords and profile PINs are hashed with PBKDF2 before they are stored.

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

Copy `frontend/.env.example` to `frontend/.env.local` for keys and origin overrides. `.env.local` is gitignored.

Optional trailer keys (Account screen, or env):

- `VITE_TMDB_API_KEY` — default. Free TMDB key for YouTube trailers and missing poster art.
- `VITE_IVA_API_KEY` — optional paid Fabric Origin / IVA key. Used only when TMDB has no match. Leave this unset.

## Connect a real catalog / video site

This frontend is built so the catalog API and the video host can be swapped in without changing React code.

1. **Catalog JSON** must match [API.md](API.md). Same paths, `kind: "movie" | "show"`, and `watch_href` on titles and episodes.
2. **Dev proxy.** Point Vite at your API with `VITE_API_ORIGIN` in `frontend/.env.local` (default `http://localhost:8090`). Restart `npm run dev` after changing it.
3. **Fetch prefix.** Leave `VITE_API_BASE` empty while using the Vite proxy, or when the built UI is served from the same origin as the catalog. If the UI is hosted on a different host than the API, set `VITE_API_BASE` to that catalog origin (no trailing slash). The API already allows CORS.
4. **Playback.** The player is only an iframe of `watch_href`. The UI never extracts a raw video URL. If those hrefs are relative (`/watch/...`), set `VITE_PLAYER_ORIGIN` to the origin of the video site (no trailing slash). Absolute `https://...` hrefs are used as-is.
5. **Images.** Use `poster_url`, `backdrop_url`, and `thumb_url`. If a file fails, the UI retries `/img?u=`. Missing or mock `/art/...` posters can fall back to TMDB art when a TMDB key is present. Keep real catalog posters when you have them.
6. **Do not run two APIs on 8090.** Stop the mock before starting the real catalog.

Accounts, profiles (including Kids and PIN), My List, Continue Watching, and taste stay in this browser. They will not sync until a later backend owns them.

## Screens

- Sign in / Sign up — local accounts; poster wall behind the card
- Who's watching — avatar glyphs, Kids profiles (PG only), optional 4-digit PIN
- Home — billboard hero, silent poster rails, hover previews on desktop, Top 10, Continue Watching
- Movies / TV Shows — genre dropdown over the billboard
- New & Popular — Top 10 plus new and trending rails
- My List — titles saved on this profile
- Taste — favorite genres, inferred weights, liked titles (account menu)
- Account — TMDB / optional IVA keys for mini trailers
- Search — `/` focuses search; clearing the query stays on Search with recent chips
- Title modal — trailer, Play / Resume / My List / thumbs, similar titles, show episodes
- Movie / show detail — still available at `/movie/:id` and `/show/:id`
- Watch — full-screen iframe of `watch_href` (hover for Back, or press Escape)

Rows use silent posters. On a mouse, hovering a tile opens a jawbone with a muted mini-trailer. On touch, a tap opens the title modal; rows swipe horizontally and the header uses a Browse menu.

Continue Watching can resume, play from the beginning, or hide a title from the row. Shows resume the last episode when history has `watch_href` / season / episode.

Taste rows are ranked from favorite genres, likes, and titles that profile has watched. History, My List, and likes do not sync across phones and the TV unless they share a browser.

Mini trailers play on the billboard, hover cards, and title modal. They default to TMDB YouTube trailers. IVA / Fabric Origin is optional and only used if that key is present and TMDB has no match. Catalog playback is still only `watch_href`.

Movies vs TV shows: the API sets `kind` to `"movie"` or `"show"` on each title. Catalog calls use `/catalog/movies` vs `/catalog/shows`. Show modals are the ones with seasons and episodes.

Episode descriptions: the UI prints `episode.synopsis` from `GET /shows/{id}`. The frontend does not look up TVMaze/TMDB itself; if the API leaves synopsis empty, that episode has no description.

See [API.md](API.md) and [openapi.json](openapi.json) for the contract.

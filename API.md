# Catalog API — frontend contract

This frontend consumes a REST API at `http://localhost:8090`. It never extracts
raw video URLs from the family catalog. Playback of a title uses `watch_href`
from the JSON payloads. Mini trailers default to TMDB YouTube. IVA / Fabric Origin
is optional paid extras, used only when a key is present and TMDB has no match.

## Base URL

- **Dev:** `http://localhost:8090` by default. Start the API with `./run-local.sh` in the
  API repo, or `node mock/server.mjs` in this repo.
- Vite proxies `/movies`, `/shows`, `/search`, `/catalog`, `/health`, `/watch`,
  `/img`, and `/art` to that origin during `npm run dev`.
- Override the proxy target with `VITE_API_ORIGIN` in `frontend/.env.local`.
- Leave `VITE_API_BASE` empty while using the proxy or same-origin hosting.
  For a split production host, set `VITE_API_BASE` to the catalog origin.
- Relative `watch_href` values are prefixed with `VITE_PLAYER_ORIGIN` when set.
  Absolute player URLs are used as-is.

CORS is open, so the Vite dev server can also call the API directly with `fetch`.

## Endpoints

| Method | Path | Query | Returns |
|--------|------|-------|---------|
| GET | `/health` | — | `{ "ok": true }` |
| GET | `/movies` | — | `MovieListItem[]` (homepage rows) |
| GET | `/movies/{movie_id}` | — | `MovieDetail` |
| GET | `/shows/{show_id}` | — | `ShowDetail` (includes `seasons`) |
| GET | `/search` | `q` (min length 2) | `MovieListItem[]` |
| GET | `/catalog/{kind}` | `genre`, `page` | `{ items: MovieListItem[], next }` (`kind` = `movies` or `shows`) |
| GET | `/watch/{media_id}` | — | `302` redirect to the player page |
| GET | `/img` | `u` (url-encoded image URL) | proxied image bytes |

`movie_id` / `show_id` are the slug ids from `MovieListItem.id`
(e.g. `37540328-back-to-the-90s-2026`).

## Models

### MovieListItem
```
id           string   required
title        string   required
kind         string             ("movie" | "show")
year         integer
rating       number             (e.g. 6.3, can be null/0)
quality      string             ("FHD", "480p", etc.)
genres       string[]
poster_url   string
href         string   required
source_id    string             (existing-site id; optional)
tmdb_id      integer            (TMDB match for art/copy; never a play URL)
```

### MovieDetail (extends the above)
```
synopsis      string
runtime       integer            (minutes)
cast          string[]
backdrop_url  string
watch_href    string             (full play URL)
```

### ShowDetail (extends MovieDetail)
```
seasons       Season[]
```

### Season
```
season_number  integer   required
episodes       Episode[]
```

### Episode
```
id          string    required
number      integer   required
title       string    required
duration    integer
synopsis    string
thumb_url   string
watch_href  string    required
```

## Playback

There is **no raw video URL**. Open `watch_href` in a full-screen `<iframe>`.
Do not construct player URLs or extract `.m3u8` streams.

For a show, an episode's `watch_href` already points at the right episode.
If `watch_href` is a relative path, set `VITE_PLAYER_ORIGIN` on the frontend.

## Images and enrichment

Playback always comes from `watch_href` on your catalog (the existing site’s
linked media). Art, logos, trailers, synopsis, and genres may be **enriched**
from TMDB.

- Send a cleaned `title`, `kind` (`movie` | `show`), and `year` so TMDB can match.
- Prefer also sending `tmdb_id` after you resolve a match. The UI uses that id
  for posters, backdrops, logos, galleries, and trailers.
- `source_id` may store the existing site’s id. Do not put play URLs there.
- Never replace `watch_href` with a TMDB or YouTube URL.
- If `poster_url` from the source site is a weak thumbnail, the UI still prefers
  TMDB art when a match exists.
- The UI also matches messy source titles (quality tags, dotted filenames, years
  in parentheses) to TMDB, then uses TMDB genres to fill empty rails. Playback
  still uses the source `watch_href`.

Use `poster_url` / `backdrop_url` / `thumb_url` as fallbacks. If an image fails,
retry through the same-origin proxy: `/img?u=<url-encoded-url>`.

# Catalog API — frontend contract

This frontend consumes a REST API at `http://localhost:8090`. It never extracts
raw video URLs. Playback uses `watch_href` from the JSON payloads.

## Base URL

- **Dev:** `http://localhost:8090` — start the API with `./run-local.sh` in the
  API repo (or whatever process you already run on `:8090`).
- Vite proxies `/movies`, `/shows`, `/search`, `/catalog`, `/health`, `/watch`,
  `/img`, and `/art` to that origin during `npm run dev`.
- For UI work without the real API, `node mock/server.mjs` serves the same
  routes from a generated catalog (120 movies, 90 shows).

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

## Images

Use `poster_url` / `backdrop_url` / `thumb_url` directly. If an image fails,
retry through the same-origin proxy: `/img?u=<url-encoded-url>`.

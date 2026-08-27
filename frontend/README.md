# Flix frontend

Vite + React + TypeScript client for the catalog API on `http://localhost:8090`.

```bash
npm install
npm run dev
```

Requires a catalog API on port 8090. From the repo root, `node mock/server.mjs` starts a local mock with recognizable movies and TV shows. From this folder, `npm run mock-api` does the same. Use the real API instead if it is already running.

Optional trailer keys: copy `.env.example` to `.env.local` and fill `VITE_TMDB_API_KEY`. Leave `VITE_IVA_API_KEY` blank unless you already have a paid Fabric Origin subscription. You can also paste keys on the Account screen. `.env.local` is gitignored.

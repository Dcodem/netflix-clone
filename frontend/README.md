# Flix frontend

Vite + React + TypeScript client for the catalog API on `http://localhost:8090`.

```bash
npm install
npm run dev
```

Requires a catalog API on port 8090. From the repo root, `node mock/server.mjs` starts a local mock with recognizable movies and TV shows. From this folder, `npm run mock-api` does the same. Use the real API instead if it is already running.

To host the UI plus that mock catalog on Vercel, deploy from the repo root (`npx vercel` or import the GitHub repo). Production uses the same `/movies` paths on the Vercel origin.

A TMDB key is already bundled for trailers and art. Leave `VITE_IVA_API_KEY` blank unless you already have a paid Fabric Origin subscription. You can paste a different TMDB key on the Account screen or in `.env.local`. `.env.local` is gitignored.

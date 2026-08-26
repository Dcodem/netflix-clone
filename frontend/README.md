# Flix frontend

Vite + React + TypeScript client for the catalog API on `http://localhost:8090`.

```bash
npm install
npm run dev
```

Requires a catalog API on port 8090. From the repo root, `node mock/server.mjs` starts a local mock with 120 movies and 90 shows. From this folder, `npm run mock-api` does the same. Use the real API instead if it is already running.

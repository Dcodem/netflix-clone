#!/usr/bin/env node
/**
 * Local catalog API mock for UI work when the real :8090 service is not running.
 * Implements the contract in API.md. Does not scrape or proxy a real catalog site.
 */
import { createServer } from 'node:http'
import { COUNTS } from './catalog.mjs'
import { handleCatalog } from './handle.mjs'

const PORT = Number(process.env.MOCK_PORT ?? 8090)
const HOST = process.env.MOCK_HOST ?? '127.0.0.1'

const server = createServer((req, res) => {
  handleCatalog(req, res)
})

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other API, or set MOCK_PORT.`)
    process.exit(1)
  }
  throw error
})

server.listen(PORT, HOST, () => {
  console.log(`Mock catalog API on http://${HOST}:${PORT} (${COUNTS.movies} movies, ${COUNTS.shows} shows)`)
})

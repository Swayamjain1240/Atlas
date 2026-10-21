import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import dotenv from 'dotenv'

import { loadConfig } from './src/config/env.js'
import { createDatabase } from './src/database/index.js'
import { createApp } from './src/app.js'

const backendDirectory = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(backendDirectory, '.env') })

export function startServer({ config = loadConfig(), database = null } = {}) {
  const ownedDatabase = database ?? createDatabase(config)
  const app = createApp({ config, database: ownedDatabase })
  const server = app.listen(config.port, config.host, () => {
    console.log(`[Atlas] Express gateway listening on ${config.host}:${config.port}`)
  })

  const shutdown = (signal) => {
    server.close(() => {
      ownedDatabase.close()
      console.log(`[Atlas] stopped after ${signal}`)
      process.exit(0)
    })
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
  return { app, server, database: ownedDatabase }
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false

if (isMainModule) startServer()

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import { loadConfig } from '../../../backend/src/config/env.js'
import { createApp } from '../../../backend/src/app.js'
import { AtlasDatabase } from '../../../backend/src/database/index.js'
import { MemoryRateLimiter } from '../../../backend/src/middleware/rate-limit.js'

const require = createRequire(import.meta.url)
const request = require('../../../backend/node_modules/supertest')

function createTestApp({ rateLimit = 100 } = {}) {
  const key = 'test-api-key-123456'
  const config = loadConfig({
    NODE_ENV: 'test',
    ATLAS_API_KEY: key,
    ATLAS_CORS_ORIGINS: 'http://localhost:5173',
  })
  const database = new AtlasDatabase({ filename: ':memory:' })
  const app = createApp({
    config,
    database,
    rateLimiter: new MemoryRateLimiter({ limit: rateLimit }),
  })
  return { app, database, key }
}

test('health is public and uses the standard response contract', async (t) => {
  const { app, database } = createTestApp()
  t.after(() => database.close())

  const response = await request(app).get('/api/v1/health')
  assert.equal(response.status, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.data.status, 'ok')
  assert.equal(response.body.data.database, 'ready')
  assert.equal(response.body.meta.version, '0.2.0')
  assert.ok(response.body.meta.request_id)
})

test('status requires valid bearer authentication and never echoes the key', async (t) => {
  const { app, database, key } = createTestApp()
  t.after(() => database.close())

  assert.equal((await request(app).get('/api/v1/status')).status, 401)
  assert.equal(
    (await request(app).get('/api/v1/status').set('Authorization', 'Bearer wrong-key')).status,
    401,
  )

  const response = await request(app)
    .get('/api/v1/status')
    .set('Authorization', `Bearer ${key}`)
  assert.equal(response.status, 200)
  assert.equal(response.body.data.database.schema_version, 1)
  assert.equal(JSON.stringify(response.body).includes(key), false)
})

test('host and origin checks reject browser-origin abuse', async (t) => {
  const { app, database } = createTestApp()
  t.after(() => database.close())

  const invalidHost = await request(app).get('/api/v1/health').set('Host', 'example.com')
  assert.equal(invalidHost.status, 400)
  assert.equal(invalidHost.body.error.code, 'INVALID_HOST')

  const invalidOrigin = await request(app)
    .get('/api/v1/health')
    .set('Origin', 'https://evil.example')
  assert.equal(invalidOrigin.status, 403)
  assert.equal(invalidOrigin.body.error.code, 'ORIGIN_NOT_ALLOWED')

  const preflight = await request(app)
    .options('/api/v1/health')
    .set('Origin', 'http://localhost:5173')
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers['access-control-allow-origin'], 'http://localhost:5173')
})

test('rate limits are enforced per route and client', async (t) => {
  const { app, database } = createTestApp({ rateLimit: 2 })
  t.after(() => database.close())

  assert.equal((await request(app).get('/api/v1/health')).status, 200)
  assert.equal((await request(app).get('/api/v1/health')).status, 200)
  const limited = await request(app).get('/api/v1/health')
  assert.equal(limited.status, 429)
  assert.equal(limited.body.error.code, 'RATE_LIMITED')
  assert.equal(limited.headers['x-ratelimit-limit'], '2')
})

test('invalid JSON and unknown routes use safe error responses', async (t) => {
  const { app, database } = createTestApp()
  t.after(() => database.close())

  const malformed = await request(app)
    .post('/api/v1/status')
    .set('Content-Type', 'application/json')
    .send('{')
  assert.equal(malformed.status, 400)
  assert.equal(malformed.body.error.code, 'INVALID_JSON')
  assert.equal(malformed.body.error.stack, undefined)

  const missing = await request(app).get('/unknown')
  assert.equal(missing.status, 404)
  assert.equal(missing.body.error.code, 'NOT_FOUND')
})

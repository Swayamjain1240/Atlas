import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import { AiServiceClient, AiServiceError } from '../../../backend/src/services/ai-client.js'
import { createApp } from '../../../backend/src/app.js'
import { loadConfig } from '../../../backend/src/config/env.js'
import { AtlasDatabase } from '../../../backend/src/database/index.js'

const require = createRequire(import.meta.url)
const request = require('../../../backend/node_modules/supertest')

function config() {
  return loadConfig({
    NODE_ENV: 'test',
    ATLAS_API_KEY: 'test-api-key-123456',
    ATLAS_CORS_ORIGINS: 'http://localhost:5173',
  })
}

test('AI service client forwards internal bearer auth and parses worker responses', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify({ success: true, data: { status: 'ready' } }), { status: 200 })
  }
  const client = new AiServiceClient({
    baseUrl: 'http://127.0.0.1:8750',
    token: 'internal-token-123456',
    fetchImpl,
  })
  const result = await client.health()
  assert.equal(result.data.status, 'ready')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer internal-token-123456')
})

test('AI service client maps aborted requests to a safe timeout error', async () => {
  const fetchImpl = (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
  })
  const client = new AiServiceClient({
    baseUrl: 'http://127.0.0.1:8750',
    token: 'internal-token-123456',
    timeoutMs: 5,
    fetchImpl,
  })
  await assert.rejects(client.health(), (error) => error instanceof AiServiceError && error.code === 'TIMEOUT')
})

test('gateway status reports authenticated AI worker readiness without exposing tokens', async (t) => {
  const database = new AtlasDatabase({ filename: ':memory:' })
  t.after(() => database.close())
  const aiClient = { health: async () => ({ data: { status: 'ready', embedding: { dimensions: 384 } } }) }
  const app = createApp({ config: config(), database, aiClient })
  const response = await request(app)
    .get('/api/v1/status')
    .set('Authorization', 'Bearer test-api-key-123456')
  assert.equal(response.status, 200)
  assert.equal(response.body.data.ai_service.status, 'ready')
  assert.equal(response.body.data.ai_service.embedding.dimensions, 384)
  assert.equal(JSON.stringify(response.body).includes('test-api-key-123456'), false)
})

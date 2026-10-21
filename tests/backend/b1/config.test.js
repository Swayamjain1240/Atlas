import assert from 'node:assert/strict'
import test from 'node:test'

import { ConfigError, loadConfig } from '../../../backend/src/config/env.js'

const baseEnvironment = {
  NODE_ENV: 'test',
  ATLAS_API_KEY: 'test-api-key-123456',
  ATLAS_CORS_ORIGINS: 'http://localhost:5173,http://localhost:8741',
}

test('configuration defaults to loopback and resolves local database paths', () => {
  const config = loadConfig({ ...baseEnvironment, ATLAS_DATA_DIR: './test-data' })
  assert.equal(config.host, '127.0.0.1')
  assert.equal(config.port, 8741)
  assert.deepEqual(config.corsOrigins, ['http://localhost:5173', 'http://localhost:8741'])
  assert.match(config.dbFile, /test-data[\\/]db[\\/]atlas\.db$/)
})

test('configuration fails closed when the API key is missing', () => {
  assert.throws(
    () => loadConfig({ ...baseEnvironment, ATLAS_API_KEY: '' }),
    (error) => error instanceof ConfigError && error.message.includes('ATLAS_API_KEY'),
  )
})

test('configuration rejects non-loopback binding and wildcard CORS', () => {
  assert.throws(
    () => loadConfig({ ...baseEnvironment, ATLAS_HOST: '0.0.0.0' }),
    (error) => error instanceof ConfigError && error.message.includes('loopback'),
  )
  assert.throws(
    () => loadConfig({ ...baseEnvironment, ATLAS_CORS_ORIGINS: '*' }),
    (error) => error instanceof ConfigError && error.message.includes('exact origins'),
  )
})

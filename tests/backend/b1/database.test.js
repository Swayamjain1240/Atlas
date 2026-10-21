import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { AtlasDatabase } from '../../../backend/src/database/index.js'

test('database migrations create the B.1 schema and remain idempotent', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-b1-db-'))
  const filename = path.join(directory, 'atlas.db')
  const database = new AtlasDatabase({ filename })

  try {
    const first = database.status()
    database.migrate()
    const second = database.status()
    const tables = database.connection
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map(({ name }) => name)

    assert.equal(first.status, 'ready')
    assert.equal(first.schema_version, 1)
    assert.equal(first.journal_mode, 'wal')
    assert.equal(first.foreign_keys, true)
    assert.deepEqual(second, first)
    assert.deepEqual(tables, [
      'app_settings',
      'chat_messages',
      'chat_sessions',
      'ingestion_jobs',
      'memories',
      'schema_migrations',
      'sources',
    ])
    assert.equal(database.connection.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get().count, 1)
  } finally {
    database.close()
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

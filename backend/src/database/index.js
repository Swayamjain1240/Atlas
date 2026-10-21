import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'

const migrationFiles = [
  {
    version: 1,
    name: '001_initial',
    filename: new URL('./migrations/001_initial.sql', import.meta.url),
  },
]

function ensureParentDirectory(filename) {
  if (filename === ':memory:') return
  fs.mkdirSync(path.dirname(filename), { recursive: true })
}

export class AtlasDatabase {
  constructor({ filename }) {
    ensureParentDirectory(filename)
    this.filename = filename
    this.connection = new Database(filename)
    this.connection.pragma('foreign_keys = ON')
    this.connection.pragma('busy_timeout = 5000')
    this.connection.pragma('journal_mode = WAL')
    this.migrate()
  }

  migrate() {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const applied = new Set(
      this.connection
        .prepare('SELECT version FROM schema_migrations ORDER BY version')
        .all()
        .map(({ version }) => version),
    )

    for (const migration of migrationFiles) {
      if (applied.has(migration.version)) continue
      const sql = fs.readFileSync(migration.filename, 'utf8')
      const applyMigration = this.connection.transaction(() => {
        this.connection.exec(sql)
        this.connection
          .prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
          .run(migration.version, migration.name)
      })
      applyMigration()
    }
  }

  status() {
    const migration = this.connection
      .prepare('SELECT MAX(version) AS version FROM schema_migrations')
      .get()
    const quickCheck = this.connection.pragma('quick_check', { simple: true })
    const journalMode = this.connection.pragma('journal_mode', { simple: true })
    return {
      status: quickCheck === 'ok' ? 'ready' : 'degraded',
      schema_version: migration.version ?? 0,
      journal_mode: String(journalMode).toLowerCase(),
      foreign_keys: this.connection.pragma('foreign_keys', { simple: true }) === 1,
    }
  }

  close() {
    if (this.connection.open) this.connection.close()
  }
}

export function createDatabase(config) {
  return new AtlasDatabase({ filename: config.dbFile })
}

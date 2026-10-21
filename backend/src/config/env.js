import os from 'node:os'
import path from 'node:path'

import { z } from 'zod'

export const API_VERSION = '0.2.0'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])

const booleanValue = (fallback) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === '') return fallback
      if (typeof value === 'boolean') return value
      return String(value).toLowerCase() === 'true'
    },
    z.boolean(),
  )

const integerValue = (fallback, minimum, maximum) =>
  z.preprocess(
    (value) => (value === undefined || value === '' ? fallback : Number(value)),
    z.number().int().min(minimum).max(maximum),
  )

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ATLAS_API_KEY: z.string().trim().min(16, 'ATLAS_API_KEY must be at least 16 characters'),
  ATLAS_HOST: z.string().trim().default('127.0.0.1'),
  ATLAS_PORT: integerValue(8741, 1, 65535),
  ATLAS_DEBUG: booleanValue(false),
  ATLAS_PRIVACY: z.enum(['local', 'hybrid']).default('local'),
  ATLAS_CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:8741'),
  ATLAS_RATE_LIMIT: integerValue(100, 1, 100000),
  ATLAS_BODY_LIMIT: z.string().trim().default('1mb'),
  ATLAS_DATA_DIR: z.string().trim().default(''),
  ATLAS_DB_DIR: z.string().trim().default(''),
  ATLAS_DB_FILE: z.string().trim().default(''),
  ATLAS_LOG_DIR: z.string().trim().default(''),
  ATLAS_CACHE_DIR: z.string().trim().default(''),
  AI_SERVICE_URL: z.string().trim().url().default('http://127.0.0.1:8750'),
  AI_SERVICE_INTERNAL_TOKEN: z.string().trim().default(''),
})

export class ConfigError extends Error {
  constructor(issues) {
    super(`Invalid Atlas backend configuration: ${issues.join('; ')}`)
    this.name = 'ConfigError'
    this.issues = issues
  }
}

function parseOrigins(value) {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (origins.length === 0 || origins.includes('*')) {
    throw new ConfigError(['ATLAS_CORS_ORIGINS must contain exact origins and cannot use *'])
  }

  for (const origin of origins) {
    let parsed
    try {
      parsed = new URL(origin)
    } catch {
      throw new ConfigError([`ATLAS_CORS_ORIGINS contains an invalid origin: ${origin}`])
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/') {
      throw new ConfigError([`ATLAS_CORS_ORIGINS contains an invalid origin: ${origin}`])
    }
  }

  return Object.freeze([...new Set(origins)])
}

function resolvePath(value, fallback) {
  return path.resolve(value || fallback)
}

export function loadConfig(environment = process.env) {
  const parsed = environmentSchema.safeParse(environment)
  if (!parsed.success) {
    throw new ConfigError(parsed.error.issues.map((issue) => issue.message))
  }

  const values = parsed.data
  if (!LOOPBACK_HOSTS.has(values.ATLAS_HOST)) {
    throw new ConfigError(['ATLAS_HOST must bind to loopback (127.0.0.1, localhost, or ::1)'])
  }

  const dataDir = resolvePath(values.ATLAS_DATA_DIR, path.join(os.homedir(), '.atlas'))
  const dbDir = resolvePath(values.ATLAS_DB_DIR, path.join(dataDir, 'db'))

  return Object.freeze({
    nodeEnv: values.NODE_ENV,
    apiKey: values.ATLAS_API_KEY,
    host: values.ATLAS_HOST,
    port: values.ATLAS_PORT,
    debug: values.ATLAS_DEBUG,
    privacyMode: values.ATLAS_PRIVACY,
    corsOrigins: parseOrigins(values.ATLAS_CORS_ORIGINS),
    rateLimitPerMinute: values.ATLAS_RATE_LIMIT,
    bodyLimit: values.ATLAS_BODY_LIMIT,
    dataDir,
    dbDir,
    dbFile: resolvePath(values.ATLAS_DB_FILE, path.join(dbDir, 'atlas.db')),
    logDir: resolvePath(values.ATLAS_LOG_DIR, path.join(dataDir, 'logs')),
    cacheDir: resolvePath(values.ATLAS_CACHE_DIR, path.join(dataDir, 'cache')),
    aiServiceUrl: values.AI_SERVICE_URL,
    aiServiceInternalToken: values.AI_SERVICE_INTERNAL_TOKEN,
    allowedHosts: Object.freeze([...LOOPBACK_HOSTS]),
  })
}

export function publicConfig(config) {
  return {
    version: API_VERSION,
    host: config.host,
    port: config.port,
    privacy_mode: config.privacyMode,
    debug: config.debug,
  }
}

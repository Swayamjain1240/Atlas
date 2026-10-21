import express from 'express'

import { apiRouter } from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { requestContext } from './middleware/request-context.js'
import { corsGuard, hostGuard, securityHeaders } from './middleware/security.js'
import { MemoryRateLimiter } from './middleware/rate-limit.js'

const logger = {
  error(error) {
    console.error('[Atlas] request failed:', error?.message ?? error)
  },
}

export function createApp({ config, database, rateLimiter = null }) {
  const app = express()
  const limiter = rateLimiter ?? new MemoryRateLimiter({ limit: config.rateLimitPerMinute })

  app.disable('x-powered-by')
  app.locals.config = config
  app.locals.logger = logger

  app.use(requestContext)
  app.use(hostGuard(config))
  app.use(securityHeaders())
  app.use(corsGuard(config))
  app.use(express.json({ limit: config.bodyLimit, strict: true }))
  app.use('/api/v1', limiter.middleware())
  app.use('/api/v1', apiRouter({ config, database }))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

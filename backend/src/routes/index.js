import { Router } from 'express'

import { healthRouter } from './health.js'
import { statusRouter } from './status.js'

export function apiRouter(dependencies) {
  const router = Router()
  router.use(healthRouter(dependencies))
  router.use(statusRouter(dependencies))
  return router
}

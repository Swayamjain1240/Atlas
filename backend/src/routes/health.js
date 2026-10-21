import { Router } from 'express'

import { API_VERSION } from '../config/env.js'
import { successResponse } from '../utils/response.js'

export function healthRouter({ config, database }) {
  const router = Router()

  router.get('/health', (req, res) => {
    res.json(
      successResponse(req, {
        status: 'ok',
        service: 'atlas-express-gateway',
        version: API_VERSION,
        privacy_mode: config.privacyMode,
        database: database.status().status,
      }),
    )
  })

  return router
}

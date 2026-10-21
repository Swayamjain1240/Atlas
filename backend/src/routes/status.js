import { Router } from 'express'

import { API_VERSION, publicConfig } from '../config/env.js'
import { requireAuth, requireScope } from '../middleware/auth.js'
import { successResponse } from '../utils/response.js'

export function statusRouter({ config, database }) {
  const router = Router()

  router.get('/status', requireAuth(config), requireScope('read'), (req, res) => {
    res.json(
      successResponse(req, {
        name: 'Atlas',
        version: API_VERSION,
        service: 'express-gateway',
        config: publicConfig(config),
        database: database.status(),
        ai_service: {
          configured: Boolean(config.aiServiceInternalToken),
          status: 'not_connected',
        },
      }),
    )
  })

  return router
}

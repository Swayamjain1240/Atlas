import { Router } from 'express'

import { API_VERSION, publicConfig } from '../config/env.js'
import { requireAuth, requireScope } from '../middleware/auth.js'
import { successResponse } from '../utils/response.js'

export function statusRouter({ config, database, aiClient = null }) {
  const router = Router()

  router.get('/status', requireAuth(config), requireScope('read'), async (req, res, next) => {
    let aiService = {
      configured: Boolean(aiClient),
      status: aiClient ? 'unknown' : 'not_configured',
    }
    if (aiClient) {
      try {
        const result = await aiClient.health({ signal: req.signal })
        aiService = {
          configured: true,
          status: result?.data?.status ?? 'unknown',
          embedding: result?.data?.embedding,
          ollama: result?.data?.ollama,
        }
      } catch (error) {
        aiService = {
          configured: true,
          status: error.code === 'TIMEOUT' ? 'timeout' : 'unavailable',
          error_code: error.code,
        }
      }
    }
    res.json(
      successResponse(req, {
        name: 'Atlas',
        version: API_VERSION,
        service: 'express-gateway',
        config: publicConfig(config),
        database: database.status(),
        ai_service: aiService,
      }),
    )
    return undefined
  })

  return router
}

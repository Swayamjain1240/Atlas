import helmet from 'helmet'

import { HttpError } from '../utils/errors.js'

export function securityHeaders() {
  return helmet({
    hsts: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'", 'http://127.0.0.1:8741', 'http://localhost:8741'],
        fontSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
  })
}

export function hostGuard(config) {
  return (req, res, next) => {
    const hostname = req.hostname
    const allowed = config.allowedHosts.includes(hostname) ||
      (config.nodeEnv === 'test' && hostname === 'testserver')

    if (!allowed) {
      return next(new HttpError(400, 'INVALID_HOST', 'Host is not allowed'))
    }
    return next()
  }
}

export function corsGuard(config) {
  return (req, res, next) => {
    const origin = req.get('Origin')
    if (!origin) return next()
    if (!config.corsOrigins.includes(origin)) {
      return next(new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origin is not allowed'))
    }

    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Request-ID')
    res.setHeader('Vary', 'Origin')

    if (req.method === 'OPTIONS') return res.status(204).end()
    return next()
  }
}

import { timingSafeEqual } from 'node:crypto'

import { HttpError } from '../utils/errors.js'

function constantTimeEqual(provided, expected) {
  const providedBuffer = Buffer.from(provided, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  if (providedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export function requireAuth(config) {
  return (req, res, next) => {
    const header = req.get('Authorization') ?? ''
    const [scheme, token, ...extra] = header.split(' ')
    if (scheme !== 'Bearer' || !token || extra.length > 0) {
      return next(
        new HttpError(401, 'UNAUTHORIZED', 'A bearer token is required', undefined),
      )
    }

    if (!constantTimeEqual(token, config.apiKey)) {
      return next(new HttpError(401, 'UNAUTHORIZED', 'Invalid credentials'))
    }

    req.auth = { type: 'api_key', scopes: ['read', 'write'] }
    return next()
  }
}

export function requireScope(scope) {
  return (req, res, next) => {
    if (!req.auth?.scopes?.includes(scope)) {
      return next(new HttpError(403, 'FORBIDDEN', 'The credential lacks the required permission'))
    }
    return next()
  }
}

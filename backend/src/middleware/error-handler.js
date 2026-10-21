import { errorResponse } from '../utils/response.js'
import { HttpError } from '../utils/errors.js'

export function notFoundHandler(req, res, next) {
  next(new HttpError(404, 'NOT_FOUND', 'Route not found'))
}

export function errorHandler(error, req, res, next) {
  let normalized = error
  if (error?.type === 'entity.parse.failed') {
    normalized = new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON')
  } else if (error?.type === 'entity.too.large') {
    normalized = new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large')
  }

  const statusCode = normalized instanceof HttpError ? normalized.statusCode : 500
  const code = normalized instanceof HttpError ? normalized.code : 'INTERNAL_ERROR'
  const message = normalized instanceof HttpError
    ? normalized.message
    : 'An internal error occurred'
  const details = normalized instanceof HttpError && req.app.locals.config.nodeEnv !== 'production'
    ? normalized.details
    : undefined

  if (statusCode >= 500 && req.app.locals.config.nodeEnv !== 'test') {
    req.app.locals.logger?.error?.(normalized)
  }

  return res.status(statusCode).json(errorResponse(req, code, message, details))
}

export function requestMeta(req) {
  const elapsed = process.hrtime.bigint() - (req.startedAt ?? process.hrtime.bigint())
  return {
    request_id: req.requestId ?? 'unknown',
    processing_time_ms: Number(elapsed / 1000000n),
    version: '0.2.0',
  }
}

export function successResponse(req, data, extraMeta = {}) {
  return {
    success: true,
    data,
    meta: { ...requestMeta(req), ...extraMeta },
  }
}

export function errorResponse(req, code, message, details = undefined) {
  const error = { code, message }
  if (details !== undefined) error.details = details
  return {
    success: false,
    error,
    meta: requestMeta(req),
  }
}

import { randomUUID } from 'node:crypto'

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/

export function requestContext(req, res, next) {
  const supplied = req.get('X-Request-ID')
  req.requestId = supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID()
  req.startedAt = process.hrtime.bigint()
  res.setHeader('X-Request-ID', req.requestId)
  next()
}

import { HttpError } from '../utils/errors.js'

function clientAddress(req) {
  return req.socket?.remoteAddress ?? 'unknown'
}

export class MemoryRateLimiter {
  constructor({ limit, windowMs = 60000, maxKeys = 10000 }) {
    this.limit = limit
    this.windowMs = windowMs
    this.maxKeys = maxKeys
    this.windows = new Map()
  }

  consume(key, now = Date.now()) {
    const cutoff = now - this.windowMs
    const current = (this.windows.get(key) ?? []).filter((timestamp) => timestamp > cutoff)

    if (current.length >= this.limit) {
      this.windows.set(key, current)
      return { allowed: false, remaining: 0, resetAt: current[0] + this.windowMs }
    }

    current.push(now)
    if (this.windows.size >= this.maxKeys && !this.windows.has(key)) {
      const oldestKey = this.windows.keys().next().value
      this.windows.delete(oldestKey)
    }
    this.windows.set(key, current)
    return {
      allowed: true,
      remaining: Math.max(0, this.limit - current.length),
      resetAt: current[0] + this.windowMs,
    }
  }

  middleware() {
    return (req, res, next) => {
      const key = `${clientAddress(req)}:${req.method}:${req.path}`
      const result = this.consume(key)
      res.setHeader('X-RateLimit-Limit', String(this.limit))
      res.setHeader('X-RateLimit-Remaining', String(result.remaining))
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

      if (!result.allowed) {
        return next(new HttpError(429, 'RATE_LIMITED', 'Rate limit exceeded'))
      }
      return next()
    }
  }
}

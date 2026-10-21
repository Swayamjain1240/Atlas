export class AiServiceError extends Error {
  constructor(code, message, statusCode = 503) {
    super(message)
    this.name = 'AiServiceError'
    this.code = code
    this.statusCode = statusCode
  }
}

export class AiServiceClient {
  constructor({ baseUrl, token, timeoutMs = 10000, fetchImpl = globalThis.fetch }) {
    if (!baseUrl || !token) {
      throw new AiServiceError('AI_SERVICE_NOT_CONFIGURED', 'AI service credentials are not configured', 503)
    }
    if (typeof fetchImpl !== 'function') {
      throw new AiServiceError('AI_SERVICE_UNAVAILABLE', 'Fetch is unavailable in this Node runtime', 503)
    }
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.token = token
    this.timeoutMs = timeoutMs
    this.fetchImpl = fetchImpl
  }

  async request(path, { method = 'GET', body, signal } = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort, { once: true })

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.token}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })

      let payload
      try {
        payload = await response.json()
      } catch {
        throw new AiServiceError('AI_SERVICE_INVALID_RESPONSE', 'AI service returned invalid JSON', 502)
      }

      if (!response.ok || payload?.success === false) {
        const code = payload?.error?.code ?? 'AI_SERVICE_UNAVAILABLE'
        const message = payload?.error?.message ?? 'AI service request failed'
        throw new AiServiceError(code, message, response.status >= 500 ? 503 : response.status)
      }
      return payload
    } catch (error) {
      if (error instanceof AiServiceError) throw error
      if (error?.name === 'AbortError') {
        throw new AiServiceError('TIMEOUT', 'AI service request timed out', 504)
      }
      throw new AiServiceError('AI_SERVICE_UNAVAILABLE', 'AI service is unavailable', 503)
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
    }
  }

  health(options = {}) {
    return this.request('/internal/health', options)
  }

  embed(texts, options = {}) {
    return this.request('/internal/embed', { ...options, method: 'POST', body: { texts } })
  }

  generate(prompt, system = undefined, options = {}) {
    return this.request('/internal/generate', {
      ...options,
      method: 'POST',
      body: { prompt, ...(system === undefined ? {} : { system }) },
    })
  }
}

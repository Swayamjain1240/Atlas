import { HttpError } from '../utils/errors.js'

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      return next(new HttpError(400, 'VALIDATION_ERROR', 'The request failed validation', details))
    }
    req[source] = result.data
    return next()
  }
}

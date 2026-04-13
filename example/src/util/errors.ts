import type { StatusCode } from 'hono/utils/http-status'

export class AppError extends Error {
  constructor(
    readonly status: StatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

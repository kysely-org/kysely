export type UserApiErrors = 'InvalidUserId' | 'UserNotFound'

export type ErrorCode = UserApiErrors

export interface ErrorBody {
  error: {
    code: ErrorCode
    message: string
  }
}

export function createError(code: ErrorCode, message: string): ErrorBody {
  return {
    error: { code, message },
  }
}

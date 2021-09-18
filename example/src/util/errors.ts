export type UserApiErrors = 'InvalidUserId' | 'UserNotFound'
export type SignInMethodApiErros =
  | 'InvalidSignInMethod'
  | 'UserAlreadyHasSignInMethod'
  | 'PasswordTooWeak'
  | 'PasswordTooLong'

export type ErrorCode = 'UnknownError' | UserApiErrors | SignInMethodApiErros

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

export class UserNotFoundError extends Error {}

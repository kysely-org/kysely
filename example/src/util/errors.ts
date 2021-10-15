export type AuthenticationErrors =
  | 'NoUserIdParameter'
  | 'InvalidAuthorizationHeader'
  | 'InvalidAuthToken'
  | 'ExpiredAuthToken'
  | 'UserMismatch'
  | 'UserOrRefreshTokenNotFound'

export type UserApiErrors = 'InvalidUser' | 'UserNotFound'

export type SignInMethodApiErros =
  | 'InvalidSignInMethod'
  | 'UserAlreadyHasSignInMethod'
  | 'PasswordTooWeak'
  | 'PasswordTooLong'
  | 'InvalidCredentials'
  | 'InvalidRefreshToken'
  | 'RefreshTokenUserIdMismatch'

export type ErrorCode =
  | 'UnknownError'
  | AuthenticationErrors
  | UserApiErrors
  | SignInMethodApiErros

export class ControllerError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly data?: any

  constructor(status: number, code: ErrorCode, message: string, data?: any) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
  }

  toJSON() {
    return {
      error: { code: this.code, message: this.message },
    }
  }
}

export class UserNotFoundError extends Error {}

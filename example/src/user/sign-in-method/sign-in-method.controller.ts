import * as signInMethodService from './sign-in-method.service'
import * as authenticationService from '../../authentication/authentication.service'
import * as authTokenService from '../../authentication/auth-token.service'

import { RefreshTokenUserIdMismatchError } from '../../authentication/auth-token.service'
import {
  PasswordTooLongError,
  PasswordTooWeakError,
  SignInMethodNotFoundError,
  UserAlreadyHasSignInMethodError,
  WrongPasswordError,
} from './sign-in-method.service'
import { validateRefreshToken } from '../../authentication/refresh-token'
import { Router } from '../../router'
import { ControllerError, UserNotFoundError } from '../../util/errors'
import { validatePasswordSignInMethod } from './sign-in-method'

export function signInMethodController(router: Router): void {
  router.post(
    '/api/v1/user/:userId/sign-in-methods',
    authenticationService.authenticateUser,
    async (ctx) => {
      const { body } = ctx.request

      if (!validatePasswordSignInMethod(body)) {
        throw new ControllerError(
          400,
          'InvalidSignInMethod',
          'invalid sign in method',
        )
      }

      try {
        await ctx.db.transaction().execute(async (trx) => {
          await signInMethodService.addPasswordSignInMethod(
            trx,
            ctx.params.userId,
            body,
          )
        })

        ctx.status = 201
        ctx.body = { success: true }
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          throw new ControllerError(404, 'UserNotFound', 'user not found')
        } else if (error instanceof PasswordTooWeakError) {
          throw new ControllerError(
            400,
            'PasswordTooWeak',
            'password is too weak',
          )
        } else if (error instanceof PasswordTooLongError) {
          throw new ControllerError(
            400,
            'PasswordTooLong',
            'password is too long',
          )
        } else if (error instanceof UserAlreadyHasSignInMethodError) {
          throw new ControllerError(
            409,
            'UserAlreadyHasSignInMethod',
            'the user already has a sign in method',
          )
        }

        throw error
      }
    },
  )

  router.post('/api/v1/user/sign-in', async (ctx) => {
    const { body } = ctx.request

    if (!validatePasswordSignInMethod(body)) {
      throw new ControllerError(
        400,
        'InvalidSignInMethod',
        'invalid sign in method',
      )
    }

    try {
      const signedInUser = await ctx.db.transaction().execute(async (trx) => {
        return signInMethodService.singInUsingPassword(trx, body)
      })

      ctx.status = 200
      ctx.body = {
        user: signedInUser.user,
        authToken: signedInUser.authToken.authToken,
        refreshToken: signedInUser.refreshToken.refreshToken,
      }
    } catch (error) {
      if (
        error instanceof UserNotFoundError ||
        error instanceof WrongPasswordError ||
        error instanceof SignInMethodNotFoundError
      ) {
        // Don't leak too much information about why the sign in failed.
        throw new ControllerError(
          401,
          'InvalidCredentials',
          'wrong email or password',
        )
      }

      throw error
    }
  })

  router.post(
    '/api/v1/user/:userId/sign-out',
    authenticationService.authenticateUser,
    async (ctx) => {
      const { body } = ctx.request

      if (!validateRefreshToken(body)) {
        throw new ControllerError(
          400,
          'InvalidRefreshToken',
          'the body must contain a valid refresh token',
        )
      }

      try {
        await authTokenService.deleteRefreshToken(
          ctx.db,
          ctx.params.userId,
          body,
        )

        ctx.status = 200
        ctx.body = { success: true }
      } catch (error) {
        if (error instanceof RefreshTokenUserIdMismatchError) {
          throw new ControllerError(
            403,
            'RefreshTokenUserIdMismatch',
            "cannot delete another user's refresh token",
          )
        }

        throw error
      }
    },
  )
}

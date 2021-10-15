import {
  authTokenService,
  RefreshTokenUserIdMismatchError,
} from '../../authentication/auth-token.service'
import { authenticationService } from '../../authentication/authentication.service'
import { validateRefreshToken } from '../../authentication/refresh-token'
import { Router } from '../../router'
import { UserNotFoundError } from '../../util/errors'
import { validatePasswordSignInMethod } from './sign-in-method'
import {
  PasswordTooLongError,
  PasswordTooWeakError,
  SignInMethodNotFoundError,
  signInMethodService,
  UserAlreadyHasSignInMethodError,
  WrongPasswordError,
} from './sign-in-method.service'

export function signInMethodController(router: Router): void {
  router.post(
    '/api/v1/user/:userId/sign-in-methods',
    authenticationService.authenticateUser,
    async (ctx) => {
      const { body } = ctx.request

      if (validatePasswordSignInMethod(body)) {
        try {
          await ctx.db.transaction(async (trx) => {
            await signInMethodService.addPasswordSignInMethod(
              trx,
              ctx.params.userId,
              body
            )
          })

          ctx.status = 201
          ctx.body = { success: true }
        } catch (error) {
          if (error instanceof UserNotFoundError) {
            ctx.throwError(404, 'UserNotFound', 'user not found')
          } else if (error instanceof PasswordTooWeakError) {
            ctx.throwError(400, 'PasswordTooWeak', 'password is too weak')
          } else if (error instanceof PasswordTooLongError) {
            ctx.throwError(400, 'PasswordTooLong', 'password is too long')
          } else if (error instanceof UserAlreadyHasSignInMethodError) {
            ctx.throwError(
              409,
              'UserAlreadyHasSignInMethod',
              'the user already has a sign in method'
            )
          }

          throw error
        }
      } else {
        console.log(validatePasswordSignInMethod.errors)
        ctx.throwError(400, 'InvalidSignInMethod', 'invalid sign in method')
      }
    }
  )

  router.post('/api/v1/user/sign-in', async (ctx) => {
    const { body } = ctx.request

    if (validatePasswordSignInMethod(body)) {
      try {
        const signedInUser = await ctx.db.transaction(async (trx) => {
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
          ctx.throwError(401, 'InvalidCredentials', 'wrong email or password')
        }

        throw error
      }
    } else {
      ctx.throwError(400, 'InvalidSignInMethod', 'invalid sign in method')
    }
  })

  router.post(
    '/api/v1/user/:userId/sign-out',
    authenticationService.authenticateUser,
    async (ctx) => {
      const { body } = ctx.request

      if (!validateRefreshToken(body)) {
        ctx.throwError(
          400,
          'InvalidRefreshToken',
          'the body must contain a valid refresh token'
        )
      }

      try {
        await authTokenService.deleteRefreshToken(
          ctx.db,
          ctx.params.userId,
          body
        )

        ctx.status = 200
        ctx.body = { success: true }
      } catch (error) {
        if (error instanceof RefreshTokenUserIdMismatchError) {
          ctx.throwError(
            403,
            'RefreshTokenUserIdMismatch',
            "cannot delete another user's refresh token"
          )

          throw error
        }
      }
    }
  )
}

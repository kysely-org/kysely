import { Router } from '../../router'
import { UserNotFoundError } from '../../util/errors'
import { validatePasswordSignInMethod } from './sign-in-method'
import {
  PasswordTooLongError,
  PasswordTooWeakError,
  signInMethodService,
  UserAlreadyHasSignInMethod,
} from './sign-in-method.service'

export function signInMethodController(router: Router): void {
  router.post('/api/v1/user/:userId/sign-in-methods', async (ctx) => {
    const { body } = ctx.request.body

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
        } else if (error instanceof UserAlreadyHasSignInMethod) {
          ctx.throwError(
            409,
            'UserAlreadyHasSignInMethod',
            'the user already has a sign in method'
          )
        }

        throw error
      }
    } else {
      ctx.throwError(400, 'InvalidSignInMethod', 'invalid sign in method')
    }
  })

  router.post('/api/v1/user/:userId/sign-in', async (ctx) => {})

  router.post('/api/v1/user/:userId/sign-out', async (ctx) => {})
}

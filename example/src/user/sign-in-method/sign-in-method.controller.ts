import { Router } from '../../router'
import { createError, UserNotFoundError } from '../../util/errors'
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
          ctx.status = 404
          ctx.body = createError('UserNotFound', 'user not found')
        } else if (error instanceof PasswordTooWeakError) {
          ctx.status = 400
          ctx.body = createError('PasswordTooWeak', 'password is too weak')
        } else if (error instanceof PasswordTooLongError) {
          ctx.status = 400
          ctx.body = createError('PasswordTooLong', 'password is too long')
        } else if (error instanceof UserAlreadyHasSignInMethod) {
          ctx.status = 409
          ctx.body = createError(
            'UserAlreadyHasSignInMethod',
            'the user already has a sign in method'
          )
        } else {
          ctx.status = 500
          ctx.body = createError('UnknownError', 'unknown error occurred')
        }
      }
    } else {
      ctx.status = 400
      ctx.body = createError('InvalidSignInMethod', 'invalid sign in method')
    }
  })

  router.post('/api/v1/user/:userId/sign-in', async (ctx) => {})

  router.post('/api/v1/user/:userId/sign-out', async (ctx) => {})
}

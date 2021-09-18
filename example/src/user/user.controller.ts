import { Router } from '../router'
import { createError } from '../util/errors'
import { signInMethodController } from './sign-in-method/sign-in-method.controller'
import { userService } from './user.service'

export function userController(router: Router): void {
  router.get('/api/v1/user/:userId', async (ctx) => {
    const { userId } = ctx.params

    if (!userId) {
      ctx.status = 400
      ctx.body = createError('InvalidUserId', 'invalid user id in the path')
      return
    }

    const user = await userService.findUserById(ctx.db, userId)

    if (!user) {
      ctx.status = 404
      ctx.body = createError(
        'UserNotFound',
        `user with id ${userId} was not found`
      )
      return
    }

    ctx.body = { user }
  })

  signInMethodController(router)
}

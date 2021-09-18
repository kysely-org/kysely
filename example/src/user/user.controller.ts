import { Router } from '../router'
import { createError } from '../util/errors'
import * as userService from './user.service'

export function userController(router: Router): void {
  router.get('/api/v1/user/:userId', async (ctx) => {
    const userId = parseInt(ctx.params.userId, 10)

    if (!userId) {
      ctx.status = 400
      ctx.body = createError('InvalidUserId', 'invalid user id in the path')
      return
    }

    const user = await userService.getUserById(ctx.db, userId)

    if (!user) {
      ctx.status = 404
      ctx.body = createError(
        'UserNotFound',
        `user with id ${userId} was not found`
      )
      return
    }

    ctx.body = user
  })
}

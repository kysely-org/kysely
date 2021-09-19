import { authTokenService } from '../authentication/auth-token.service'
import { authenticationService } from '../authentication/authentication.service'
import { Router } from '../router'
import { signInMethodController } from './sign-in-method/sign-in-method.controller'
import { validateCreateAnonymousUserRequest } from './user'
import { userService } from './user.service'

export function userController(router: Router): void {
  router.post('/api/v1/user', async (ctx) => {
    const { body } = ctx.request

    if (validateCreateAnonymousUserRequest(body)) {
      const result = await ctx.db.transaction(async (trx) => {
        return userService.createAnonymousUser(trx, body)
      })

      ctx.status = 201
      ctx.body = {
        user: result.user,
        authToken: result.authToken.authToken,
        refreshToken: result.refreshToken.refreshToken,
      }
    } else {
      ctx.throwError(400, 'InvalidUser', 'invalid user')
    }
  })

  router.get(
    '/api/v1/user/:userId',
    authenticationService.authenticateUser,
    async (ctx) => {
      const { userId } = ctx.params
      const user = await userService.findUserById(ctx.db, userId)

      if (!user) {
        ctx.throwError(
          404,
          'UserNotFound',
          `user with id ${userId} was not found`
        )
      }

      ctx.body = { user }
    }
  )

  signInMethodController(router)
}

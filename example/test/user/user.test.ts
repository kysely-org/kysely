import { after } from 'mocha'
import { expect } from 'chai'

import { TestContext } from '../test-context'
import { User } from '../../src/user/user'
import { AxiosResponse } from 'axios'

const EMAIL = 'foo@bar.fake'
const PASSWORD = '12345678'

describe('user tests', () => {
  const ctx = new TestContext()

  before(ctx.before)
  beforeEach(ctx.beforeEach)

  after(ctx.after)
  afterEach(ctx.afterEach)

  it('should create an anonoymous user', async () => {
    const res = await ctx.request.post(`/api/v1/user`, {
      firstName: 'Anon',
    })

    expect(res.status).to.equal(201)
    expect(res.data.user.firstName).to.equal('Anon')
    expect(res.data.user.lastName).to.equal(null)
    expect(res.data.user.email).to.equal(null)

    // The returned auth token should be usable.
    const getRes = await ctx.request.get<{ user: User }>(
      `/api/v1/user/${res.data.user.id}`,
      createAuthHeaders(res.data.authToken)
    )

    expect(getRes.status).to.equal(200)
    expect(getRes.data.user).to.eql(res.data.user)
  })

  it('should get user by id', async () => {
    const { user, authToken } = await ctx.createUser()

    const res = await ctx.request.get<{ user: User }>(
      `/api/v1/user/${user.id}`,
      createAuthHeaders(authToken)
    )

    expect(res.status).to.equal(200)
    expect(res.data).to.eql({ user })
  })

  it('should add a password sign in method for a user', async () => {
    const { user, authToken } = await ctx.createUser()
    const res = await createPasswordSignInMethod(user.id, authToken)

    expect(res.status).to.equal(201)
    expect(res.data.success).to.equal(true)
  })

  it('should sign in a user', async () => {
    const { user, authToken } = await ctx.createUser()
    await createPasswordSignInMethod(user.id, authToken)

    const res = await ctx.request.post(`/api/v1/user/sign-in`, {
      email: EMAIL,
      password: PASSWORD,
    })

    expect(res.status).to.equal(200)

    // The returned auth token should be usable.
    const getRes = await ctx.request.get<{ user: User }>(
      `/api/v1/user/${res.data.user.id}`,
      createAuthHeaders(authToken)
    )

    expect(getRes.status).to.equal(200)
    expect(getRes.data.user).to.eql(res.data.user)
  })

  it('should sign out a user', async () => {
    const { user, authToken, refreshToken } = await ctx.createUser()

    const res = await ctx.request.post(
      `/api/v1/user/${user.id}/sign-out`,
      { refreshToken },
      createAuthHeaders(authToken)
    )

    expect(res.status).to.equal(200)

    // The auth token should no longer be usable.
    const getRes = await ctx.request.get(
      `/api/v1/user/${user.id}`,
      createAuthHeaders(authToken)
    )

    expect(getRes.status).to.equal(404)
    expect(getRes.data.error.code).to.equal('UserOrRefreshTokenNotFound')
  })

  function createAuthHeaders(authToken: string) {
    return {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  }

  async function createPasswordSignInMethod(
    userId: string,
    authToken: string
  ): Promise<AxiosResponse<{ success: true }>> {
    return await ctx.request.post<{ success: true }>(
      `/api/v1/user/${userId}/sign-in-methods`,
      { email: EMAIL, password: PASSWORD },
      createAuthHeaders(authToken)
    )
  }
})

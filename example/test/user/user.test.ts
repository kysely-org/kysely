import { after } from 'mocha'
import { expect } from 'chai'

import { TestContext } from '../test-context'
import { SignedInUser } from '../../src/user/user.service'
import { User } from '../../src/user/user'

describe('user tests', () => {
  const ctx = new TestContext()

  before(ctx.before)
  beforeEach(ctx.beforeEach)

  after(ctx.after)
  afterEach(ctx.afterEach)

  it('should create an anonoymous user', async () => {
    const res = await ctx.request.post<SignedInUser>(`/api/v1/user`, {
      firstName: 'Anon',
    })

    expect(res.status).to.equal(201)
    expect(res.data.user.firstName).to.equal('Anon')
    expect(res.data.user.lastName).to.equal(null)
    expect(res.data.user.email).to.equal(null)

    // The returned auth token should be usable.
    const getRes = await ctx.request.get<{ user: User }>(
      `/api/v1/user/${res.data.user.id}`,
      {
        headers: {
          Authorization: `Bearer ${res.data.authToken}`,
        },
      }
    )

    expect(getRes.status).to.equal(200)
    expect(getRes.data.user).to.eql(res.data.user)
  })

  it('should get user by id', async () => {
    const { user, authToken } = await ctx.createUser()

    const res = await ctx.request.get<{ user: User }>(
      `/api/v1/user/${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(res.status).to.equal(200)
    expect(res.data).to.eql({ user })
  })
})

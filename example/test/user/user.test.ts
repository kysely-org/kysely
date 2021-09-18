import { after } from 'mocha'
import { expect } from 'chai'

import { TestContext } from '../test-context'

describe('user tests', () => {
  const ctx = new TestContext()

  before(ctx.before)
  beforeEach(ctx.beforeEach)

  after(ctx.after)
  afterEach(ctx.afterEach)

  it('should get user by id', async () => {
    const user = await ctx.createUser()
    const res = await ctx.request.get(`/api/v1/user/${user.id}`)

    expect(res.status).to.equal(200)
    expect(res.data).to.eql({ user })
  })
})

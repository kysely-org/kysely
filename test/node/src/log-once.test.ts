import { expect } from 'chai'
import { createSandbox, SinonSpy } from 'sinon'
import { logOnce } from '../../..'

describe('logOnce', () => {
  let logSpy: SinonSpy
  const sandbox = createSandbox()

  before(() => {
    logSpy = sandbox.spy(console, 'log')
  })

  it('should log each message once.', () => {
    const message = 'Kysely is awesome!'
    const message2 = 'Type-safety is everything!'

    logOnce(message)
    logOnce(message)
    logOnce(message2)
    logOnce(message2)
    logOnce(message)

    expect(logSpy.calledTwice).to.be.true
    expect(logSpy.getCall(0).args[0]).to.equal(message)
    expect(logSpy.getCall(1).args[0]).to.equal(message2)
  })
})

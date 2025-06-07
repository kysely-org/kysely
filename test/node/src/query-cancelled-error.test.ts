import { QueryCancelledError } from '../../../'
import { expect } from './test-setup.js'

describe('QueryCancelledError', () => {
  it('should create error with default message', () => {
    const error = new QueryCancelledError()

    expect(error).to.be.instanceOf(Error)
    expect(error).to.be.instanceOf(QueryCancelledError)
    expect(error.name).to.equal('QueryCancelledError')
    expect(error.message).to.equal('Query was cancelled')
  })

  it('should create error with custom message', () => {
    const customMessage = 'Custom cancellation message'
    const error = new QueryCancelledError(customMessage)

    expect(error).to.be.instanceOf(Error)
    expect(error).to.be.instanceOf(QueryCancelledError)
    expect(error.name).to.equal('QueryCancelledError')
    expect(error.message).to.equal(customMessage)
  })

  it('should be throwable and catchable', () => {
    const error = new QueryCancelledError('Test error')

    expect(() => {
      throw error
    }).to.throw(QueryCancelledError, 'Test error')
  })

  it('should be identifiable in error handling', () => {
    const error = new QueryCancelledError('Test cancellation')

    try {
      throw error
    } catch (error) {
      expect(error instanceof QueryCancelledError).to.equal(true)

      if (error instanceof QueryCancelledError) {
        expect(error.message).to.equal('Test cancellation')
        expect(error.name).to.equal('QueryCancelledError')
      }
    }
  })

  it('should work with async error handling', async () => {
    const error = new QueryCancelledError('Async cancellation')

    try {
      await Promise.reject(error)
    } catch (error: any) {
      expect(error instanceof QueryCancelledError).to.equal(true)
      expect(error.message).to.equal('Async cancellation')
    }
  })

  it('should maintain proper error stack trace', () => {
    const error = new QueryCancelledError('Stack trace test')

    expect(error.stack).to.be.a('string')
    expect(error.stack).to.include('QueryCancelledError')
    expect(error.stack).to.include('Stack trace test')
  })
})

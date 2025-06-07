import { expect } from 'chai'
import { QueryCancelledError } from '../../../'

describe('QueryCancelledError', () => {
  describe('Error Creation and Properties', () => {
    it('should create error with default message', () => {
      const error = new QueryCancelledError()

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(QueryCancelledError)
      expect(error.name).to.equal('QueryCancelledError')
      expect(error.message).to.equal('Query was cancelled')
    })

    it('should create error with custom message', () => {
      const customMessage = 'Operation was aborted by user'
      const error = new QueryCancelledError(customMessage)

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(QueryCancelledError)
      expect(error.name).to.equal('QueryCancelledError')
      expect(error.message).to.equal(customMessage)
    })

    it('should create error with empty string message', () => {
      const error = new QueryCancelledError('')

      expect(error.name).to.equal('QueryCancelledError')
      expect(error.message).to.equal('')
    })

    it('should create error with undefined message (uses default)', () => {
      const error = new QueryCancelledError(undefined)

      expect(error.name).to.equal('QueryCancelledError')
      expect(error.message).to.equal('Query was cancelled')
    })
  })

  describe('Error Inheritance', () => {
    it('should be throwable and catchable', () => {
      const error = new QueryCancelledError('Test error')

      expect(() => {
        throw error
      }).to.throw(QueryCancelledError, 'Test error')
    })

    it('should be catchable as Error', () => {
      let caughtError: Error | null = null

      try {
        throw new QueryCancelledError('Test error')
      } catch (error) {
        caughtError = error as Error
      }

      expect(caughtError).to.be.instanceOf(Error)
      expect(caughtError).to.be.instanceOf(QueryCancelledError)
      expect(caughtError?.message).to.equal('Test error')
    })

    it('should be identifiable in error handling', () => {
      const error = new QueryCancelledError('Test error')

      const isQueryCancelledError = error instanceof QueryCancelledError
      const isError = error instanceof Error
      const nameCheck = error.name === 'QueryCancelledError'

      expect(isQueryCancelledError).to.be.true
      expect(isError).to.be.true
      expect(nameCheck).to.be.true
    })
  })

  describe('Error Stack and Properties', () => {
    it('should have proper error stack', () => {
      const error = new QueryCancelledError('Test error')

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('QueryCancelledError')
      expect(error.stack).to.include('Test error')
    })

    it('should maintain proper error stack trace', () => {
      function throwQueryCancelledError() {
        throw new QueryCancelledError('Nested error')
      }

      let error: QueryCancelledError | null = null

      try {
        throwQueryCancelledError()
      } catch (e) {
        error = e as QueryCancelledError
      }

      expect(error).to.be.instanceOf(QueryCancelledError)
      expect(error?.stack).to.include('throwQueryCancelledError')
    })

    it('should preserve custom properties when extended', () => {
      class CustomQueryCancelledError extends QueryCancelledError {
        constructor(
          message: string,
          public readonly customProp: string,
        ) {
          super(message)
        }
      }

      const error = new CustomQueryCancelledError(
        'Custom error',
        'custom value',
      )

      expect(error).to.be.instanceOf(QueryCancelledError)
      expect(error).to.be.instanceOf(CustomQueryCancelledError)
      expect(error.customProp).to.equal('custom value')
      expect(error.message).to.equal('Custom error')
      expect(error.name).to.equal('QueryCancelledError')
    })
  })

  describe('Error Message Handling', () => {
    it('should handle various message types', () => {
      const errorWithString = new QueryCancelledError('String message')
      const errorWithNumber = new QueryCancelledError(String(123))
      const errorWithObject = new QueryCancelledError(
        JSON.stringify({ reason: 'timeout' }),
      )

      expect(errorWithString.message).to.equal('String message')
      expect(errorWithNumber.message).to.equal('123')
      expect(errorWithObject.message).to.equal('{"reason":"timeout"}')
    })

    it('should handle multiline messages', () => {
      const multilineMessage = `Query was cancelled due to:
- User navigation
- Timeout exceeded
- Resource limits`

      const error = new QueryCancelledError(multilineMessage)

      expect(error.message).to.equal(multilineMessage)
      expect(error.message).to.include('User navigation')
      expect(error.message).to.include('Timeout exceeded')
    })

    it('should handle special characters in messages', () => {
      const specialMessage =
        'Query cancelled: "SELECT * FROM table" with param $1 = \'value\''
      const error = new QueryCancelledError(specialMessage)

      expect(error.message).to.equal(specialMessage)
    })
  })

  describe('Async Error Handling', () => {
    it('should work with async error handling', async () => {
      async function asyncFunction() {
        throw new QueryCancelledError('Async error')
      }

      try {
        await asyncFunction()
        expect.fail('Should have thrown QueryCancelledError')
      } catch (error) {
        expect(error).to.be.instanceOf(QueryCancelledError)
        expect((error as QueryCancelledError).message).to.equal('Async error')
      }
    })

    it('should work with Promise.reject', async () => {
      const promise = Promise.reject(
        new QueryCancelledError('Promise rejection'),
      )

      try {
        await promise
        expect.fail('Should have thrown QueryCancelledError')
      } catch (error) {
        expect(error).to.be.instanceOf(QueryCancelledError)
        expect((error as QueryCancelledError).message).to.equal(
          'Promise rejection',
        )
      }
    })
  })

  describe('Error Serialization', () => {
    it('should be serializable to JSON', () => {
      const error = new QueryCancelledError('Serialization test')

      const serialized = JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
      })

      const parsed = JSON.parse(serialized)

      expect(parsed.name).to.equal('QueryCancelledError')
      expect(parsed.message).to.equal('Serialization test')
      expect(parsed.stack).to.be.a('string')
    })

    it('should maintain error properties after serialization round-trip', () => {
      const originalError = new QueryCancelledError('Round trip test')

      const errorData = {
        name: originalError.name,
        message: originalError.message,
      }

      const serialized = JSON.stringify(errorData)
      const parsed = JSON.parse(serialized)

      const recreatedError = new QueryCancelledError(parsed.message)

      expect(recreatedError.name).to.equal(originalError.name)
      expect(recreatedError.message).to.equal(originalError.message)
    })
  })
})

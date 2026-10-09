import { ParseJSONResultsPlugin } from '../../../dist/index.js'
import { createQueryId } from '../../../dist/util/query-id.js'
import { expect } from './test-setup.js'
import merge from 'prototype-pollution-vulnerable-lodash.merge-dont-upgrade'

describe('ParseJSONResultsPlugin', () => {
  describe("when `objectStrategy` is 'create'", () => {
    let plugin: ParseJSONResultsPlugin

    beforeEach(() => {
      plugin = new ParseJSONResultsPlugin({ objectStrategy: 'create' })
    })

    it('should parse JSON results that contain readonly arrays/objects', async () => {
      await plugin.transformResult({
        queryId: createQueryId(),
        result: {
          rows: [
            Object.freeze({
              id: 1,
              carIds: Object.freeze([1, 2, 3]),
              metadata: JSON.stringify({ foo: 'bar' }),
            }),
          ],
        },
      })
    })
  })

  it('should omit dangerious keys when JSON parsing, denying prototype pollution downstream', async () => {
    const plugin = new ParseJSONResultsPlugin({ objectStrategy: 'create' })

    const maliciousRow = {
      id: 1,
      __proto__: JSON.stringify({ isAdmin: true }),
      joe: JSON.stringify({
        age: 30,
        __proto__: { isAdmin: true },
        constructor: JSON.stringify({
          prototype: { isAdmin: true },
          true: false,
        }),
        joe: JSON.stringify({
          __proto__: { isAdmin: true },
          true: false,
        }),
      }),
      constructor: JSON.stringify({
        prototype: { isAdmin: true },
        true: false,
        __proto__: { isAdmin: true },
      }),
      prototype: JSON.stringify({
        isAdmin: true,
        __proto__: { isAdmin: true },
      }),
    }

    const {
      rows: [rowParsedByPlugin],
    } = await plugin.transformResult({
      queryId: createQueryId(),
      result: {
        rows: [maliciousRow],
      },
    })

    const mergedWithRowParsedByPlugin = merge({}, rowParsedByPlugin)

    expect((mergedWithRowParsedByPlugin as any).isAdmin).to.be.undefined
  })

  describe('when candidate JSON fails to parse', () => {
    it('should silence console.error and keep original value when `onError` is false', async () => {
      const originalConsoleError = console.error
      let called = false
      console.error = () => {
        called = true
      }

      try {
        const plugin = new ParseJSONResultsPlugin({ onError: false })
        const nonJsonGuid = '{51196F13-6AD0-C1B8-E2B4-A1F9AE17003E}'

        const {
          rows: [row],
        } = await plugin.transformResult({
          queryId: createQueryId(),
          result: {
            rows: [{ codeName: nonJsonGuid }],
          },
        })

        expect(row.codeName).to.equal(nonJsonGuid)
        expect(called).to.be.false
      } finally {
        console.error = originalConsoleError
      }
    })

    it('should invoke `onError` callback with error, value, and jsonPath', async () => {
      let capturedError: unknown
      let capturedValue: string | undefined
      let capturedPath: string | undefined

      const plugin = new ParseJSONResultsPlugin({
        onError: (error, value, jsonPath) => {
          capturedError = error
          capturedValue = value
          capturedPath = jsonPath
        },
      })

      const nonJsonGuid = '{51196F13-6AD0-C1B8-E2B4-A1F9AE17003E}'

      const {
        rows: [row],
      } = await plugin.transformResult({
        queryId: createQueryId(),
        result: {
          rows: [{ codeName: nonJsonGuid }],
        },
      })

      expect(row.codeName).to.equal(nonJsonGuid)
      expect(capturedError).to.be.instanceOf(SyntaxError)
      expect(capturedValue).to.equal(nonJsonGuid)
      expect(capturedPath).to.equal('$[0]."codeName"')
    })
  })
})

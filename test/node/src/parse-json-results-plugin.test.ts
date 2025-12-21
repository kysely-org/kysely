import { ParseJSONResultsPlugin } from '../../..'
import { createQueryId } from '../../../dist/cjs/util/query-id.js'
import { expect } from './test-setup'
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
})

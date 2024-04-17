import { ParseJSONResultsPlugin } from '../../..'
import { createQueryId } from '../../../dist/cjs/util/query-id.js'

describe.only('ParseJSONResultsPlugin', () => {
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
})

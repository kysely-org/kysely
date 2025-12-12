import {
  CamelCasePlugin,
  CamelCasePluginOptions,
  createQueryId,
  CreateTableNode,
} from '../../..'
import { expect } from './test-setup'

describe('CamelCasePlugin', () => {
  type TestCaseWithOptions = {
    name: string
    options?: CamelCasePluginOptions
    schema: [source: string, expected: string][]
    result: [source: string, expected: string][]
  }
  const testCaseWithOptions: TestCaseWithOptions[] = [
    {
      name: 'undefined',
      options: undefined,
      schema: [
        ['asis', 'asis'],
        ['fooBar', 'foo_bar'],
        ['aFOOBar', 'a_foobar'],
        ['_fooBar', '_foo_bar'],
      ],
      result: [
        ['asis', 'asis'],
        ['foo_bar', 'fooBar'],
        ['a_f_o_o_bar', 'aFOOBar'],
        ['_id', '_Id'],
      ],
    },
    {
      name: 'upperCase',
      options: { upperCase: true },
      schema: [
        ['foo', 'FOO'],
        ['fooBar', 'FOO_BAR'],
      ],
      result: [
        ['asis', 'asis'],
        ['FOO', 'foo'],
        ['foo_bar', 'fooBar'],
        ['FOO_BAR', 'fooBar'],
      ],
    },
    {
      name: 'underscoreBetweenUppercaseLetters',
      options: { underscoreBetweenUppercaseLetters: true },
      schema: [
        ['asis', 'asis'],
        ['fooBar', 'foo_bar'],
        ['aFOOBar', 'a_f_o_o_bar'],
        ['_fooBar', '_foo_bar'],
      ],
      result: [
        ['asis', 'asis'],
        ['foo_bar', 'fooBar'],
        ['a_f_o_o_bar', 'aFOOBar'],
      ],
    },
    {
      name: 'underscoreBeforeDigits',
      options: { underscoreBeforeDigits: true },
      schema: [
        ['asis', 'asis'],
        ['fooBar', 'foo_bar'],
        ['foo12Bar', 'foo_12_bar'],
      ],
      result: [
        ['asis', 'asis'],
        ['foo_bar', 'fooBar'],
        ['a_f_o_o_bar', 'aFOOBar'],
      ],
    },
  ]

  for (const {
    name,
    options,
    schema: schemaTestCases,
    result: resultTestCases,
  } of testCaseWithOptions) {
    describe(`with "${name}" options`, () => {
      const plugin = new CamelCasePlugin(options)

      for (const [source, expected] of schemaTestCases) {
        it(`should convert schema "${source}"`, () => {
          const result = plugin.transformQuery({
            queryId: createQueryId(),
            node: {
              kind: 'CreateTableNode',
              table: {
                kind: 'TableNode',
                table: {
                  kind: 'SchemableIdentifierNode',
                  identifier: { kind: 'IdentifierNode', name: source },
                },
              },
              columns: [],
            },
          }) as CreateTableNode
          expect(result.table.table.identifier.name).to.equal(expected)
        })
      }

      for (const [source, expected] of resultTestCases) {
        it(`should convert result "${source}"`, async () => {
          const { rows } = await plugin.transformResult({
            queryId: createQueryId(),
            result: { rows: [{ [source]: 123456789 }] },
          })
          expect(rows[0]).has.key(expected)
          expect(rows[0][expected]).to.equal(123456789)
        })
      }
    })
  }
})

import {
  AliasNode,
  type DatabaseConnection,
  DummyDriver,
  IdentifierNode,
  Kysely,
  type KyselyPlugin,
  OperationNodeTransformer,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  PostgresDialect,
  type QueryResult,
  SelectionNode,
  TableNode,
} from '../../../dist/index.js'
import { type Database, expect } from './test-setup.js'

describe('plugin composition', () => {
  class TestConnection implements DatabaseConnection {
    executeQuery(): Promise<QueryResult<any>> {
      return Promise.resolve({
        rows: [{ moshe: 'haim' }, { moshe: 'rivka' }],
      })
    }

    async *streamQuery() {
      throw new Error('unimplemented!')
    }
  }

  class TestDriver extends DummyDriver {
    acquireConnection() {
      return Promise.resolve(new TestConnection())
    }
  }

  class TestDialect extends PostgresDialect {
    constructor() {
      super({ pool: {} as never })
    }

    createDriver() {
      return new TestDriver()
    }
  }

  function getDB(plugins: KyselyPlugin[]): Kysely<Database> {
    return new Kysely<Database>({ dialect: new TestDialect(), plugins })
  }

  describe('transformQuery', () => {
    it('runs plugins in registration order, feeding each output into the next', () => {
      class TestPlugin
        extends OperationNodeTransformer
        implements KyselyPlugin
      {
        readonly #selectionAlias: string
        readonly #tableAlias?: string

        constructor(selectionAlias: string, tableAlias?: string) {
          super()
          this.#selectionAlias = selectionAlias
          this.#tableAlias = tableAlias
        }

        transformQuery(args: PluginTransformQueryArgs) {
          return this.transformNode(args.node)
        }

        transformResult(args: PluginTransformResultArgs) {
          return Promise.resolve(args.result)
        }

        transformSelection(node: SelectionNode) {
          return SelectionNode.create(
            AliasNode.create(
              AliasNode.is(node.selection)
                ? node.selection.node
                : node.selection,
              IdentifierNode.create(this.#selectionAlias),
            ),
          )
        }

        transformTable(node: TableNode) {
          if (!this.#tableAlias) {
            return node
          }

          return AliasNode.create(
            node,
            IdentifierNode.create(this.#tableAlias),
          ) as never
        }
      }

      const { sql } = getDB([new TestPlugin('c', 'p'), new TestPlugin('b')])
        .selectFrom('person')
        .select('id')
        .compile()

      expect(sql).to.equal('select "id" as "b" from "person" as "p"')
    })
  })

  describe('transformResult', () => {
    it('runs plugins in registration order, feeding each output into the next', async () => {
      class TestPlugin implements KyselyPlugin {
        readonly #item0Mapper
        readonly #item1Mapper

        constructor(
          item0Mapper: (item: any) => any,
          item1Mapper: (item: any) => any = (item) => item,
        ) {
          this.#item0Mapper = item0Mapper
          this.#item1Mapper = item1Mapper
        }

        transformQuery(args: PluginTransformQueryArgs) {
          return args.node
        }

        transformResult(args: PluginTransformResultArgs) {
          return Promise.resolve({
            ...args.result,
            rows: [
              this.#item0Mapper(args.result.rows[0]),
              this.#item1Mapper(args.result.rows[1]),
              ...args.result.rows.slice(2),
            ],
          })
        }
      }

      const nehorays = await getDB([
        new TestPlugin(
          (item) => ({ ...item, yossi: 'brurya' }),
          (item) => ({ ...item, yossi: 'tikva' }),
        ),
        new TestPlugin((item) => ({ ...item, yossi: 'avraham' })),
      ])
        .$extendTables<{ nehorays: { moshe: string } }>()
        .selectFrom('nehorays')
        .selectAll()
        .execute()

      expect(nehorays).to.deep.equal([
        { moshe: 'haim', yossi: 'avraham' },
        { moshe: 'rivka', yossi: 'tikva' },
      ])
    })
  })
})

import {
  ColumnDefinitionBuilder,
  ColumnType,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from '../../..'
import {
  BuiltInDialect,
  DIALECTS,
  NOT_SUPPORTED,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  insertDefaultDataSet,
  testSql,
} from './test-setup.js'

type TestContext = Awaited<ReturnType<typeof initJSONTest>>

for (const dialect of DIALECTS) {
  describe(`${dialect}: json traversal`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initJSONTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultJSONDataSet(ctx)
    })

    afterEach(async () => {
      await clearJSONDatabase(ctx)
    })

    after(async () => {
      await destroyJSONTest(ctx)
    })

    if (dialect !== 'postgres') {
      it('should execute a query with column->>$.key in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb.ref('website', '->>$').key('url').as('website_url')
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            parameters: [],
            sql: "select `website`->>'$.url' as `website_url` from `person_metadata`",
          },
          sqlite: {
            parameters: [],
            sql: `select "website"->>'$.url' as "website_url" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { website_url: 'https://www.jenniferaniston.com' },
          { website_url: 'https://www.arnoldschwarzenegger.com' },
          { website_url: 'https://www.sylvesterstallone.com' },
        ])
      })

      it('should execute a query with column->>$[0] in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) => eb.ref('nicknames', '->>$').at(0).as('nickname'))

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            parameters: [],
            sql: "select `nicknames`->>'$[0]' as `nickname` from `person_metadata`",
          },
          sqlite: {
            parameters: [],
            sql: `select "nicknames"->>'$[0]' as "nickname" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { nickname: 'J.A.' },
          { nickname: 'A.S.' },
          { nickname: 'S.S.' },
        ])
      })

      it('should execute a query with column->>$.key.key in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb.ref('profile', '->>$').key('auth').key('roles').as('roles')
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            parameters: [],
            sql: "select `profile`->>'$.auth.roles' as `roles` from `person_metadata`",
          },
          sqlite: {
            parameters: [],
            sql: `select "profile"->>'$.auth.roles' as "roles" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { roles: ['contributor', 'moderator'] },
          { roles: ['contributor', 'moderator'] },
          { roles: ['contributor', 'moderator'] },
        ])
      })

      it('should execute a query with column->>$.key[0] in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb.ref('profile', '->>$').key('tags').at(0).as('main_tag')
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            parameters: [],
            sql: "select `profile`->>'$.tags[0]' as `main_tag` from `person_metadata`",
          },
          sqlite: {
            parameters: [],
            sql: `select "profile"->>'$.tags[0]' as "main_tag" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { main_tag: 'awesome' },
          { main_tag: 'awesome' },
          { main_tag: 'awesome' },
        ])
      })

      it('should execute a query with column->>$[0].key in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb
              .ref('experience', '->>$')
              .at(0)
              .key('establishment')
              .as('establishment')
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            parameters: [],
            sql: "select `experience`->>'$[0].establishment' as `establishment` from `person_metadata`",
          },
          sqlite: {
            parameters: [],
            sql: `select "experience"->>'$[0].establishment' as "establishment" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { establishment: 'The University of Life' },
          { establishment: 'The University of Life' },
          { establishment: 'The University of Life' },
        ])
      })

      it('should execute a query with column->>$[0][0] in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb.ref('schedule', '->>$').at(0).at(0).as('january_1st_schedule')
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            parameters: [],
            sql: "select `schedule`->>'$[0][0]' as `january_1st_schedule` from `person_metadata`",
          },
          sqlite: {
            parameters: [],
            sql: `select "schedule"->>'$[0][0]' as "january_1st_schedule" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { january_1st_schedule: [{ name: 'Gym', time: '12:15' }] },
          { january_1st_schedule: [{ name: 'Gym', time: '12:15' }] },
          { january_1st_schedule: [{ name: 'Gym', time: '12:15' }] },
        ])
      })

      if (dialect === 'mysql') {
        it('should execute a query with column->>$[last] in select clause', async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('nicknames', '->>$').at('last').as('nickname')
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select `nicknames`->>'$[last]' as `nickname` from `person_metadata`",
            },
            sqlite: NOT_SUPPORTED,
          })

          const results = await query.execute()

          expect(results).to.containSubset([
            { nickname: 'Aniston the Magnificent' },
            { nickname: 'Schwarzenegger the Magnificent' },
            { nickname: 'Stallone the Magnificent' },
          ])
        })
      }

      if (dialect === 'sqlite') {
        it('should execute a query with column->>$[#-1] in select clause', async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('nicknames', '->>$').at('#-1').as('nickname')
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: {
              parameters: [],
              sql: `select "nicknames"->>'$[#-1]' as "nickname" from "person_metadata"`,
            },
          })

          const results = await query.execute()

          expect(results).to.containSubset([
            { nickname: 'Aniston the Magnificent' },
            { nickname: 'Schwarzenegger the Magnificent' },
            { nickname: 'Stallone the Magnificent' },
          ])
        })
      }
    }

    if (dialect !== 'mysql') {
      it('should execute a query with column->>key in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) => eb.ref('website', '->>').key('url').as('website_url'))

        testSql(query, dialect, {
          postgres: {
            parameters: [],
            sql: `select "website"->>'url' as "website_url" from "person_metadata"`,
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            parameters: [],
            sql: `select "website"->>'url' as "website_url" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { website_url: 'https://www.jenniferaniston.com' },
          { website_url: 'https://www.arnoldschwarzenegger.com' },
          { website_url: 'https://www.sylvesterstallone.com' },
        ])
      })

      it('should execute a query with column->>0 in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) => eb.ref('nicknames', '->>').at(0).as('nickname'))

        testSql(query, dialect, {
          postgres: {
            parameters: [],
            sql: `select "nicknames"->>0 as "nickname" from "person_metadata"`,
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            parameters: [],
            sql: `select "nicknames"->>0 as "nickname" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { nickname: 'J.A.' },
          { nickname: 'A.S.' },
          { nickname: 'S.S.' },
        ])
      })

      it('should execute a query with column->key->>key in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb.ref('profile', '->>').key('auth').key('roles').as('roles')
          )

        testSql(query, dialect, {
          postgres: {
            parameters: [],
            sql: `select "profile"->'auth'->>'roles' as "roles" from "person_metadata"`,
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            parameters: [],
            sql: `select "profile"->'auth'->>'roles' as "roles" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { roles: ['contributor', 'moderator'] },
          { roles: ['contributor', 'moderator'] },
          { roles: ['contributor', 'moderator'] },
        ])
      })

      it('should execute a query with column->key->>0 in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb.ref('profile', '->>').key('tags').at(0).as('main_tag')
          )

        testSql(query, dialect, {
          postgres: {
            parameters: [],
            sql: `select "profile"->'tags'->>0 as "main_tag" from "person_metadata"`,
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            parameters: [],
            sql: `select "profile"->'tags'->>0 as "main_tag" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { main_tag: 'awesome' },
          { main_tag: 'awesome' },
          { main_tag: 'awesome' },
        ])
      })

      it('should execute a query with column->0->>key in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb
              .ref('experience', '->>')
              .at(0)
              .key('establishment')
              .as('establishment')
          )

        testSql(query, dialect, {
          postgres: {
            parameters: [],
            sql: `select "experience"->0->>'establishment' as "establishment" from "person_metadata"`,
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            parameters: [],
            sql: `select "experience"->0->>'establishment' as "establishment" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { establishment: 'The University of Life' },
          { establishment: 'The University of Life' },
          { establishment: 'The University of Life' },
        ])
      })

      it('should execute a query with column->0->>0 in select clause', async () => {
        const query = ctx.db
          .selectFrom('person_metadata')
          .select((eb) =>
            eb.ref('schedule', '->>').at(0).at(0).as('january_1st_schedule')
          )

        testSql(query, dialect, {
          postgres: {
            parameters: [],
            sql: `select "schedule"->0->>0 as "january_1st_schedule" from "person_metadata"`,
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            parameters: [],
            sql: `select "schedule"->0->>0 as "january_1st_schedule" from "person_metadata"`,
          },
        })

        const results = await query.execute()

        expect(results).to.containSubset([
          { january_1st_schedule: [{ name: 'Gym', time: '12:15' }] },
          { january_1st_schedule: [{ name: 'Gym', time: '12:15' }] },
          { january_1st_schedule: [{ name: 'Gym', time: '12:15' }] },
        ])
      })

      if (dialect === 'postgres') {
        it('should execute a query with column->>-1 in select clause', async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) => eb.ref('nicknames', '->>').at(-1).as('nickname'))

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select "nicknames"->>-1 as "nickname" from "person_metadata"`,
            },
            mysql: NOT_SUPPORTED,
            sqlite: {
              parameters: [],
              sql: `select "nicknames"->>-1 as "nickname" from "person_metadata"`,
            },
          })

          const results = await query.execute()

          expect(results).to.containSubset([
            { nickname: 'Aniston the Magnificent' },
            { nickname: 'Schwarzenegger the Magnificent' },
            { nickname: 'Stallone the Magnificent' },
          ])
        })
      }
    }
  })
}

async function initJSONTest<D extends BuiltInDialect>(
  ctx: Mocha.Context,
  dialect: D
) {
  const testContext = await initTest(ctx, dialect)

  const db = testContext.db
    .withTables<{
      person_metadata: {
        person_id: number
        website: ColumnType<{ url: string }, string, string>
        nicknames: ColumnType<string[], string, string>
        profile: ColumnType<
          {
            auth: {
              roles: string[]
              last_login?: { device: string }
            }
            tags: string[]
          },
          string,
          string
        >
        experience: ColumnType<
          {
            establishment: string
          }[],
          string,
          string
        >
        schedule: ColumnType<
          { name: string; time: string }[][][],
          string,
          string
        >
      }
    }>()
    .withPlugin(
      new (class implements KyselyPlugin {
        transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
          return args.node
        }
        async transformResult(
          args: PluginTransformResultArgs
        ): Promise<QueryResult<UnknownRow>> {
          if (Array.isArray(args.result.rows)) {
            return {
              ...args.result,
              rows: args.result.rows.map((row) =>
                Object.keys(row).reduce<UnknownRow>((obj, key) => {
                  let value = row[key]

                  if (
                    typeof value === 'string' &&
                    value.match(/^[\[\{]/) != null
                  ) {
                    try {
                      value = JSON.parse(value)
                    } catch (err) {}
                  }

                  obj[key] = value
                  return obj
                }, {})
              ),
            }
          }

          return args.result
        }
      })()
    )

  const jsonColumnDataType = resolveJSONColumnDataType(dialect)
  const notNull = (cb: ColumnDefinitionBuilder) => cb.notNull()

  await db.schema
    .createTable('person_metadata')
    .addColumn('person_id', 'integer', (cb) =>
      cb.primaryKey().references('person.id')
    )
    .addColumn('website', jsonColumnDataType, notNull)
    .addColumn('nicknames', jsonColumnDataType, notNull)
    .addColumn('profile', jsonColumnDataType, notNull)
    .addColumn('experience', jsonColumnDataType, notNull)
    .addColumn('schedule', jsonColumnDataType, notNull)
    .execute()

  return { ...testContext, db }
}

function resolveJSONColumnDataType(dialect: BuiltInDialect) {
  switch (dialect) {
    case 'postgres':
      return 'jsonb'
    case 'mysql':
      return 'json'
    case 'sqlite':
      return 'text'
  }
}

async function insertDefaultJSONDataSet(ctx: TestContext) {
  await insertDefaultDataSet(ctx as any)

  const people = await ctx.db
    .selectFrom('person')
    .select(['id', 'first_name', 'last_name'])
    .execute()

  await ctx.db
    .insertInto('person_metadata')
    .values(
      people
        .filter((person) => person.first_name && person.last_name)
        .map((person) => ({
          person_id: person.id,
          website: JSON.stringify({
            url: `https://www.${person.first_name!.toLowerCase()}${person.last_name!.toLowerCase()}.com`,
          }),
          nicknames: JSON.stringify([
            `${person.first_name![0]}.${person.last_name![0]}.`,
            `${person.first_name} the Great`,
            `${person.last_name} the Magnificent`,
          ]),
          profile: JSON.stringify({
            tags: ['awesome'],
            auth: {
              roles: ['contributor', 'moderator'],
              last_login: {
                device: 'android',
              },
            },
          }),
          experience: JSON.stringify([
            {
              establishment: 'The University of Life',
            },
          ]),
          schedule: JSON.stringify([[[{ name: 'Gym', time: '12:15' }]]]),
        }))
    )
    .execute()
}

async function clearJSONDatabase(ctx: TestContext) {
  await ctx.db.deleteFrom('person_metadata').execute()
  await clearDatabase(ctx as any)
}

async function destroyJSONTest(ctx: TestContext) {
  await ctx.db.schema.dropTable('person_metadata').execute()
  await destroyTest(ctx as any)
}

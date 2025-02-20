import {
  ColumnDefinitionBuilder,
  JSONColumnType,
  ParseJSONResultsPlugin,
  SqlBool,
  sql,
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
import { getNonEmptyArray } from './utils'

type TestContext = Awaited<ReturnType<typeof initJSONTest>>

for (const dialect of DIALECTS.filter((dialect) => dialect !== 'mssql')) {
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

    if (dialect === 'mysql' || dialect === 'sqlite') {
      describe('JSON reference using JSON Path syntax ($)', () => {
        const jsonOperator = dialect === 'mysql' ? '->$' : '->>$'

        it(`should execute a query with column${jsonOperator}.key in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('website', jsonOperator).key('url').as('website_url'),
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select `website`->'$.url' as `website_url` from `person_metadata`",
            },
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column${jsonOperator}[0] in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('nicknames', jsonOperator).at(0).as('nickname'),
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select `nicknames`->'$[0]' as `nickname` from `person_metadata`",
            },
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column${jsonOperator}.key.key in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb
                .ref('profile', jsonOperator)
                .key('auth')
                .key('roles')
                .as('roles'),
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select `profile`->'$.auth.roles' as `roles` from `person_metadata`",
            },
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column${jsonOperator}.key[0] in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('profile', jsonOperator).key('tags').at(0).as('main_tag'),
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select `profile`->'$.tags[0]' as `main_tag` from `person_metadata`",
            },
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column${jsonOperator}[0].key in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb
                .ref('experience', jsonOperator)
                .at(0)
                .key('establishment')
                .as('establishment'),
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select `experience`->'$[0].establishment' as `establishment` from `person_metadata`",
            },
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column${jsonOperator}[0][0] in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb
                .ref('schedule', jsonOperator)
                .at(0)
                .at(0)
                .as('january_1st_schedule'),
            )

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select `schedule`->'$[0][0]' as `january_1st_schedule` from `person_metadata`",
            },
            mssql: NOT_SUPPORTED,
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
          it('should execute a query with column->$[last] in select clause', async () => {
            const query = ctx.db
              .selectFrom('person_metadata')
              .select((eb) =>
                eb.ref('nicknames', '->$').at('last').as('nickname'),
              )

            testSql(query, dialect, {
              postgres: NOT_SUPPORTED,
              mysql: {
                parameters: [],
                sql: "select `nicknames`->'$[last]' as `nickname` from `person_metadata`",
              },
              mssql: NOT_SUPPORTED,
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
                eb.ref('nicknames', '->>$').at('#-1').as('nickname'),
              )

            testSql(query, dialect, {
              postgres: NOT_SUPPORTED,
              mysql: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
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

        const expectedBooleanValue = dialect === 'mysql' ? true : 1

        it(`should execute a query with column${jsonOperator} in select clause with non-string properties`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) => [
              eb
                .ref('profile', jsonOperator)
                .key('auth')
                .key('is_verified')
                .as('is_verified'),
              eb
                .ref('profile', jsonOperator)
                .key('auth')
                .key('login_count')
                .as('login_count'),
              eb.ref('profile', jsonOperator).key('avatar').as('avatar'),
            ])

          const results = await query.execute()

          expect(results).to.containSubset([
            {
              is_verified: expectedBooleanValue,
              login_count: 12,
              avatar: null,
            },
          ])
        })

        it(`should execute a query with column${jsonOperator}.key.key in where clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .where((eb) =>
              eb(
                eb.ref('profile', jsonOperator).key('auth').key('login_count'),
                '=',
                12,
              ),
            )
            .selectAll()

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [12],
              sql: "select * from `person_metadata` where `profile`->'$.auth.login_count' = ?",
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              parameters: [12],
              sql: `select * from "person_metadata" where "profile"->>'$.auth.login_count' = ?`,
            },
          })

          const results = await query.execute()

          expect(results).to.have.length(1)
          expect(results[0].profile.auth.login_count).to.equal(12)
        })

        it(`should execute a query with column${jsonOperator}.key.key in order by clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .orderBy(
              (eb) =>
                eb.ref('profile', jsonOperator).key('auth').key('login_count'),
              'desc',
            )
            .selectAll()

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: [],
              sql: "select * from `person_metadata` order by `profile`->'$.auth.login_count' desc",
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              parameters: [],
              sql: `select * from "person_metadata" order by "profile"->>'$.auth.login_count' desc`,
            },
          })

          const results = await query.execute()

          expect(results).to.have.length(3)
          expect(results[0].profile.auth.login_count).to.equal(14)
          expect(results[1].profile.auth.login_count).to.equal(13)
          expect(results[2].profile.auth.login_count).to.equal(12)
        })
      })

      describe('Standalone JSON path syntax ($)', () => {
        it('should execute a query with json_set function', async () => {
          const lastItem = dialect === 'mysql' ? 'last' : '#-1'

          const query = ctx.db
            .updateTable('person_metadata')
            .set('experience', (eb) =>
              eb.fn('json_set', [
                'experience',
                eb.jsonPath<'experience'>().at(lastItem).key('establishment'),
                eb.val('Papa Johns'),
              ]),
            )
            .where('person_id', '=', 911)

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              parameters: ['Papa Johns', 911],
              sql: "update `person_metadata` set `experience` = json_set(`experience`, '$[last].establishment', ?) where `person_id` = ?",
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              parameters: ['Papa Johns', 911],
              sql: `update "person_metadata" set "experience" = json_set("experience", '$[#-1].establishment', ?) where "person_id" = ?`,
            },
          })

          await query.execute()
        })
      })
    }

    if (dialect === 'postgres' || dialect === 'sqlite') {
      describe('JSON reference using PostgreSQL-style syntax (->->->>)', () => {
        const jsonOperator = dialect === 'postgres' ? '->' : '->>'

        it(`should execute a query with column${jsonOperator}key in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('website', jsonOperator).key('url').as('website_url'),
            )

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select "website"->'url' as "website_url" from "person_metadata"`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column${jsonOperator}0 in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('nicknames', jsonOperator).at(0).as('nickname'),
            )

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select "nicknames"->0 as "nickname" from "person_metadata"`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column->key${jsonOperator}key in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb
                .ref('profile', jsonOperator)
                .key('auth')
                .key('roles')
                .as('roles'),
            )

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select "profile"->'auth'->'roles' as "roles" from "person_metadata"`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column->key${jsonOperator}0 in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb.ref('profile', jsonOperator).key('tags').at(0).as('main_tag'),
            )

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select "profile"->'tags'->0 as "main_tag" from "person_metadata"`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column->0${jsonOperator}key in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb
                .ref('experience', jsonOperator)
                .at(0)
                .key('establishment')
                .as('establishment'),
            )

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select "experience"->0->'establishment' as "establishment" from "person_metadata"`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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

        it(`should execute a query with column->0${jsonOperator}0 in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) =>
              eb
                .ref('schedule', jsonOperator)
                .at(0)
                .at(0)
                .as('january_1st_schedule'),
            )

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select "schedule"->0->0 as "january_1st_schedule" from "person_metadata"`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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
          it('should execute a query with column->-1 in select clause', async () => {
            const query = ctx.db
              .selectFrom('person_metadata')
              .select((eb) => eb.ref('nicknames', '->').at(-1).as('nickname'))

            testSql(query, dialect, {
              postgres: {
                parameters: [],
                sql: `select "nicknames"->-1 as "nickname" from "person_metadata"`,
              },
              mysql: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
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

        const expectedBooleanValue = dialect === 'postgres' ? true : 1

        it(`should execute a query with column${jsonOperator} in select clause with non-string properties`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .select((eb) => [
              eb
                .ref('profile', jsonOperator)
                .key('auth')
                .key('is_verified')
                .as('is_verified'),
              eb
                .ref('profile', jsonOperator)
                .key('auth')
                .key('login_count')
                .as('login_count'),
              eb.ref('profile', jsonOperator).key('avatar').as('avatar'),
            ])

          const results = await query.execute()

          expect(results).to.containSubset([
            {
              is_verified: expectedBooleanValue,
              login_count: 12,
              avatar: null,
            },
          ])
        })

        it(`should execute a query with column->key${jsonOperator}key in where clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .where((eb) =>
              eb(
                eb.ref('profile', jsonOperator).key('auth').key('login_count'),
                '=',
                12,
              ),
            )
            .selectAll()

          testSql(query, dialect, {
            postgres: {
              parameters: [12],
              sql: `select * from "person_metadata" where "profile"->'auth'->'login_count' = $1`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: {
              parameters: [12],
              sql: `select * from "person_metadata" where "profile"->'auth'->>'login_count' = ?`,
            },
          })

          const results = await query.execute()

          expect(results).to.have.length(1)
          expect(results[0].profile.auth.login_count).to.equal(12)
        })

        it(`should execute a query with column->key${jsonOperator}key in order by clause`, async () => {
          const query = ctx.db
            .selectFrom('person_metadata')
            .orderBy(
              (eb) =>
                eb.ref('profile', jsonOperator).key('auth').key('login_count'),
              'desc',
            )
            .selectAll()

          testSql(query, dialect, {
            postgres: {
              parameters: [],
              sql: `select * from "person_metadata" order by "profile"->'auth'->'login_count' desc`,
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: {
              parameters: [],
              sql: `select * from "person_metadata" order by "profile"->'auth'->>'login_count' desc`,
            },
          })

          const results = await query.execute()

          expect(results).to.have.length(3)
          expect(results[0].profile.auth.login_count).to.equal(14)
          expect(results[1].profile.auth.login_count).to.equal(13)
          expect(results[2].profile.auth.login_count).to.equal(12)
        })
      })
    }
  })
}

async function initJSONTest<D extends BuiltInDialect>(
  ctx: Mocha.Context,
  dialect: D,
) {
  const testContext = await initTest(ctx, dialect)

  let db = testContext.db.withTables<{
    person_metadata: {
      person_id: number
      website: JSONColumnType<{ url: string }>
      nicknames: JSONColumnType<string[]>
      profile: JSONColumnType<{
        auth: {
          roles: string[]
          last_login?: { device: string }
          is_verified: SqlBool
          login_count: number
        }
        avatar: string | null
        tags: string[]
      }>
      experience: JSONColumnType<
        {
          establishment: string
        }[]
      >
      schedule: JSONColumnType<{ name: string; time: string }[][][]>
    }
  }>()

  if (dialect === 'sqlite') {
    db = db.withPlugin(new ParseJSONResultsPlugin())
  }

  const jsonColumnDataType = resolveJSONColumnDataType(dialect)
  const notNull = (cb: ColumnDefinitionBuilder) => cb.notNull()

  await db.schema
    .createTable('person_metadata')
    .addColumn('person_id', 'integer', (cb) =>
      cb.primaryKey().references('person.id'),
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
    case 'mssql':
      return sql`nvarchar(max)`
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

  const values = getNonEmptyArray(
    people
      .filter((person) => person.first_name && person.last_name)
      .map((person, index) => ({
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
            login_count: 12 + index,
            is_verified: true,
          },
          avatar: null,
        }),
        experience: JSON.stringify([
          {
            establishment: 'The University of Life',
          },
        ]),
        schedule: JSON.stringify([[[{ name: 'Gym', time: '12:15' }]]]),
      })),
  )

  if (values) {
    await ctx.db.insertInto('person_metadata').values(values).execute()
  }
}

async function clearJSONDatabase(ctx: TestContext) {
  await ctx.db.deleteFrom('person_metadata').execute()
  await clearDatabase(ctx as any)
}

async function destroyJSONTest(ctx: TestContext) {
  await ctx.db.schema.dropTable('person_metadata').execute()
  await destroyTest(ctx as any)
}

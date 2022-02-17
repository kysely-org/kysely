import { sql } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  TEST_INIT_TIMEOUT,
  NOT_SUPPORTED,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: with`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should create a select query with common table expressions', async () => {
      const query = ctx.db
        .with('jennifer_and_sylvester', (db) =>
          db
            .selectFrom('person')
            .where('first_name', '=', 'Jennifer')
            .orWhere('first_name', '=', 'Sylvester')
            .select(['id', 'first_name', 'gender'])
        )
        .with('sylvester', (db) =>
          db
            .selectFrom('jennifer_and_sylvester')
            .where('gender', '=', 'male')
            .selectAll()
        )
        .selectFrom('sylvester')
        .selectAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'with "jennifer_and_sylvester" as (select "id", "first_name", "gender" from "person" where "first_name" = $1 or "first_name" = $2), "sylvester" as (select * from "jennifer_and_sylvester" where "gender" = $3) select * from "sylvester"',
          parameters: ['Jennifer', 'Sylvester', 'male'],
        },
        mysql: {
          sql: 'with `jennifer_and_sylvester` as (select `id`, `first_name`, `gender` from `person` where `first_name` = ? or `first_name` = ?), `sylvester` as (select * from `jennifer_and_sylvester` where `gender` = ?) select * from `sylvester`',
          parameters: ['Jennifer', 'Sylvester', 'male'],
        },
        sqlite: {
          sql: 'with "jennifer_and_sylvester" as (select "id", "first_name", "gender" from "person" where "first_name" = ? or "first_name" = ?), "sylvester" as (select * from "jennifer_and_sylvester" where "gender" = ?) select * from "sylvester"',
          parameters: ['Jennifer', 'Sylvester', 'male'],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(1)
      expect(Object.keys(result[0]).sort()).to.eql([
        'first_name',
        'gender',
        'id',
      ])
      expect(result[0]).to.containSubset({
        first_name: 'Sylvester',
        gender: 'male',
      })
    })

    it('common table expression names can contain columns', async () => {
      const query = ctx.db
        .with('arnold(id, first_name)', (db) =>
          db
            .selectFrom('person')
            .where('first_name', '=', 'Arnold')
            .select(['id', 'first_name'])
        )
        .selectFrom('arnold')
        .selectAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'with "arnold"("id", "first_name") as (select "id", "first_name" from "person" where "first_name" = $1) select * from "arnold"',
          parameters: ['Arnold'],
        },
        mysql: {
          sql: 'with `arnold`(`id`, `first_name`) as (select `id`, `first_name` from `person` where `first_name` = ?) select * from `arnold`',
          parameters: ['Arnold'],
        },
        sqlite: {
          sql: 'with "arnold"("id", "first_name") as (select "id", "first_name" from "person" where "first_name" = ?) select * from "arnold"',
          parameters: ['Arnold'],
        },
      })

      await query.execute()
    })

    if (dialect === 'postgres') {
      it('recursive common table expressions can refer to themselves', async () => {
        await ctx.db.transaction().execute(async (trx) => {
          // Create a temporary table that gets dropped when the transaction ends.
          await trx.schema
            .createTable('node')
            .temporary()
            .addColumn('name', 'varchar', (col) => col.notNull().unique())
            .addColumn('parent', 'varchar', (col) =>
              col.references('node.name')
            )
            .onCommit('drop')
            .execute()

          // Extend the database type with the temporary table.
          const nodeTrx = trx.withTables<{
            node: {
              name: string
              parent: string | null
            }
          }>()

          // Insert some items to the temporary table.
          await nodeTrx
            .insertInto('node')
            .values([
              { name: 'node3', parent: null },
              { name: 'node2', parent: 'node3' },
              { name: 'node1', parent: 'node2' },
            ])
            .execute()

          // Fetch a node and all it's ancestors using a single recursive CTE.
          const query = nodeTrx
            .withRecursive('ancestors(name, parent)', (db) =>
              db
                .selectFrom('node')
                .where('name', '=', 'node1')
                .select(['name', 'parent'])
                .unionAll(
                  db
                    .selectFrom('node')
                    .innerJoin('ancestors', 'node.name', 'ancestors.parent')
                    .select(['node.name', 'node.parent'])
                )
            )
            .selectFrom('ancestors')
            .select('name')

          testSql(query, dialect, {
            postgres: {
              sql: 'with recursive "ancestors"("name", "parent") as (select "name", "parent" from "node" where "name" = $1 union all select "node"."name", "node"."parent" from "node" inner join "ancestors" on "node"."name" = "ancestors"."parent") select "name" from "ancestors"',
              parameters: ['node1'],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.execute()

          expect(result).to.eql([
            { name: 'node1' },
            { name: 'node2' },
            { name: 'node3' },
          ])
        })
      })
    }

    if (dialect !== 'mysql') {
      it('should create an insert query with common table expressions', async () => {
        const query = ctx.db
          .with('jennifer', (db) =>
            db
              .selectFrom('person')
              .where('first_name', '=', 'Jennifer')
              .select(['id', 'first_name', 'gender'])
          )
          .insertInto('pet')
          .values({
            owner_id: (eb) => eb.selectFrom('jennifer').select('id'),
            name: (eb) => eb.selectFrom('jennifer').select('first_name'),
            species: 'cat',
          })

        testSql(query, dialect, {
          postgres: {
            sql: 'with "jennifer" as (select "id", "first_name", "gender" from "person" where "first_name" = $1) insert into "pet" ("owner_id", "name", "species") values ((select "id" from "jennifer"), (select "first_name" from "jennifer"), $2)',
            parameters: ['Jennifer', 'cat'],
          },
          sqlite: {
            sql: 'with "jennifer" as (select "id", "first_name", "gender" from "person" where "first_name" = ?) insert into "pet" ("owner_id", "name", "species") values ((select "id" from "jennifer"), (select "first_name" from "jennifer"), ?)',
            parameters: ['Jennifer', 'cat'],
          },
          mysql: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    if (dialect !== 'mysql' && dialect !== 'sqlite') {
      it('should create a with query where CTEs are inserts updates and deletes', async () => {
        const query = ctx.db
          .with('deleted_arnold', (db) =>
            db
              .deleteFrom('person')
              .where('first_name', '=', 'Arnold')
              .returning('first_name as deleted_first_name')
          )
          .with('inserted_matt', (db) =>
            db
              .insertInto('person')
              .values({
                first_name: 'Matt',
                last_name: 'Damon',
                gender: 'male',
              })
              .returning('first_name as inserted_first_name')
          )
          .with('updated_jennifer', (db) =>
            db
              .updateTable('person')
              .where('first_name', '=', 'Jennifer')
              .set({ last_name: 'Lawrence' })
              .returning('first_name as updated_first_name')
          )
          .selectFrom('deleted_arnold')
          .innerJoin('inserted_matt', (join) => join.on(sql`1`, '=', sql`1`))
          .innerJoin('updated_jennifer', (join) => join.on(sql`1`, '=', sql`1`))
          .selectAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'with "deleted_arnold" as (delete from "person" where "first_name" = $1 returning "first_name" as "deleted_first_name"), "inserted_matt" as (insert into "person" ("first_name", "last_name", "gender") values ($2, $3, $4) returning "first_name" as "inserted_first_name"), "updated_jennifer" as (update "person" set "last_name" = $5 where "first_name" = $6 returning "first_name" as "updated_first_name") select * from "deleted_arnold" inner join "inserted_matt" on 1 = 1 inner join "updated_jennifer" on 1 = 1',
            parameters: [
              'Arnold',
              'Matt',
              'Damon',
              'male',
              'Lawrence',
              'Jennifer',
            ],
          },
          sqlite: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
        })

        const result = await query.execute()
        expect(result).to.have.length(1)
        expect(result[0]).to.eql({
          deleted_first_name: 'Arnold',
          inserted_first_name: 'Matt',
          updated_first_name: 'Jennifer',
        })
      })
    }
  })
}

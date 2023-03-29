import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertDefaultDataSet,
  TestContext,
  testSql,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: expressions`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
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

    it('expression kitchen sink', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll('person')
        .where(
          ({ and, or, cmpr, bxp, fn, exists, not, ref, val, selectFrom }) =>
            and([
              or([
                not(cmpr('first_name', '=', 'Jennifer')),
                cmpr(bxp('id', '+', 1), '>', 10),
                cmpr(ref('id'), 'in', val([10, 20, 30])),
                or([cmpr(fn('upper', ['first_name']), '=', 'SYLVESTER')]),
                // Empty or
                or([]),
              ]),
              exists(
                selectFrom('pet')
                  .select('pet.id')
                  .whereRef('pet.owner_id', '=', 'person.id')
              ),
              // Empty and
              and([]),
            ])
        )

      testSql(query, dialect, {
        postgres: {
          sql: 'select "person".* from "person" where ((not "first_name" = $1 or "id" + $2 > $3 or "id" in ($4, $5, $6) or upper("first_name") = $7 or false) and exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id") and true)',
          parameters: ['Jennifer', 1, 10, 10, 20, 30, 'SYLVESTER'],
        },
        mysql: {
          sql: 'select `person`.* from `person` where ((not `first_name` = ? or `id` + ? > ? or `id` in (?, ?, ?) or upper(`first_name`) = ? or false) and exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id`) and true)',
          parameters: ['Jennifer', 1, 10, 10, 20, 30, 'SYLVESTER'],
        },
        sqlite: {
          sql: 'select "person".* from "person" where ((not "first_name" = ? or "id" + ? > ? or "id" in (?, ?, ?) or upper("first_name") = ? or false) and exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id") and true)',
          parameters: ['Jennifer', 1, 10, 10, 20, 30, 'SYLVESTER'],
        },
      })

      await query.execute()
    })
  })
}

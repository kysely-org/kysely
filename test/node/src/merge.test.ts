import { MergeResult, sql } from '../../..'
import { mergeAction } from '../../../helpers/postgres'
import {
  DIALECTS,
  NOT_SUPPORTED,
  TestContext,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  insertDefaultDataSet,
  testSql,
} from './test-setup.js'

for (const dialect of DIALECTS.filter(
  (dialect) => dialect === 'postgres' || dialect === 'mssql',
)) {
  describe.only(`merge (${dialect})`, () => {
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

    describe('using', () => {
      it('should perform a merge...using table simple on...when matched then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete;',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(3n)
      })

      it('should add a modifyEnd clause to the query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .modifyEnd(sql.raw('-- this is a comment'))
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete -- this is a comment',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete -- this is a comment;',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })
      })

      it('should perform a merge...using table alias simple on alias...when matched then delete query', async () => {
        const query = ctx.db
          .mergeInto('person as pr')
          .using('pet as pt', 'pt.owner_id', 'pr.id')
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" as "pr" using "pet" as "pt" on "pt"."owner_id" = "pr"."id" when matched then delete',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" as "pr" using "pet" as "pt" on "pt"."owner_id" = "pr"."id" when matched then delete;',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(3n)
      })

      it('should perform a merge...using table complex on...when matched then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', (on) =>
            on
              .onRef('pet.owner_id', '=', 'person.id')
              .on('pet.name', '=', 'Lucky'),
          )
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = $1 when matched then delete',
            parameters: ['Lucky'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = @1 when matched then delete;',
            parameters: ['Lucky'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(0n)
      })

      it('should perform a merge...using subquery simple on...when matched then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using(
            ctx.db
              .selectFrom('pet')
              .select('owner_id')
              .where('name', '=', 'Lucky')
              .as('pet'),
            'pet.owner_id',
            'person.id',
          )
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using (select "owner_id" from "pet" where "name" = $1) as "pet" on "pet"."owner_id" = "person"."id" when matched then delete',
            parameters: ['Lucky'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using (select "owner_id" from "pet" where "name" = @1) as "pet" on "pet"."owner_id" = "person"."id" when matched then delete;',
            parameters: ['Lucky'],
          },
          sqlite: NOT_SUPPORTED,
        })
      })
    })

    describe('whenMatched', () => {
      it('should perform a merge...using table simple on...when matched and simple binary then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatchedAnd('person.gender', '=', 'female')
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and "person"."gender" = $1 then delete',
            parameters: ['female'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and "person"."gender" = @1 then delete;',
            parameters: ['female'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(1n)
      })

      it('should perform a merge...using table simple on...when matched and simple binary cross ref then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatchedAndRef('person.first_name', '=', 'pet.name')
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and "person"."first_name" = "pet"."name" then delete',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and "person"."first_name" = "pet"."name" then delete;',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(0n)
      })

      it('should perform a merge...using table simple on...when matched and complex and then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatchedAnd((eb) =>
            eb('person.gender', '=', 'female').and(
              'person.first_name',
              '=',
              eb.ref('pet.name'),
            ),
          )
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and ("person"."gender" = $1 and "person"."first_name" = "pet"."name") then delete',
            parameters: ['female'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and ("person"."gender" = @1 and "person"."first_name" = "pet"."name") then delete;',
            parameters: ['female'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(0n)
      })

      it('should perform a merge...using table simple on...when matched and complex or then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatchedAnd((eb) =>
            eb('person.gender', '=', 'female').or(
              'person.first_name',
              '=',
              eb.ref('pet.name'),
            ),
          )
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and ("person"."gender" = $1 or "person"."first_name" = "pet"."name") then delete',
            parameters: ['female'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched and ("person"."gender" = @1 or "person"."first_name" = "pet"."name") then delete;',
            parameters: ['female'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(1n)
      })

      if (dialect === 'postgres') {
        it('should perform a merge...using table...when matched then do nothing query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenMatched()
            .thenDoNothing()

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then do nothing',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(0n)
        })
      }

      describe('update', () => {
        it('should perform a merge...using table simple on...when matched then update set object query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenMatched()
            .thenUpdateSet({
              middle_name: 'pet owner',
            })

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = $1',
              parameters: ['pet owner'],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = @1;',
              parameters: ['pet owner'],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })

        it('should perform a merge...using table simple on...when matched then update set object ref query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenMatched()
            .thenUpdateSet((eb) => ({
              first_name: eb.ref('person.last_name'),
              middle_name: eb.ref('pet.name'),
            }))

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "first_name" = "person"."last_name", "middle_name" = "pet"."name"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "first_name" = "person"."last_name", "middle_name" = "pet"."name";',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })

        it('should perform a merge...using table simple on...when matched then update set column query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenMatched()
            .thenUpdateSet('middle_name', 'pet owner')

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = $1',
              parameters: ['pet owner'],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = @1;',
              parameters: ['pet owner'],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })

        it('should perform a merge...using table simple on...when matched then update set column ref query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenMatched()
            .thenUpdateSet('first_name', (eb) => eb.ref('person.last_name'))

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "first_name" = "person"."last_name"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "first_name" = "person"."last_name";',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })

        it('should perform a merge...using table simple on...when matched then update set column cross ref query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenMatched()
            .thenUpdateSet('middle_name', (eb) => eb.ref('pet.name'))

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name";',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })

        it('should perform a merge...using table simple on...when matched then update set complex query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenMatched()
            .thenUpdate((ub) =>
              ub
                .set('first_name', (eb) => eb.ref('person.last_name'))
                .set('middle_name', (eb) => eb.ref('pet.name'))
                .set({
                  marital_status: 'single',
                }),
            )

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "first_name" = "person"."last_name", "middle_name" = "pet"."name", "marital_status" = $1',
              parameters: ['single'],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "first_name" = "person"."last_name", "middle_name" = "pet"."name", "marital_status" = @1;',
              parameters: ['single'],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })
      })
    })

    describe('whenNotMatched', () => {
      if (dialect === 'postgres') {
        it('should perform a merge...using table simple on...when not matched then do nothing query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', 'pet.owner_id', 'person.id')
            .whenNotMatched()
            .thenDoNothing()

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched then do nothing',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(0n)
        })
      }

      describe('insert', () => {
        it('should perform a merge...using table complex on...when not matched then insert values query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', (on) =>
              on
                .onRef('pet.owner_id', '=', 'person.id')
                .on('pet.name', '=', 'NO_SUCH_PET_NAME'),
            )
            .whenNotMatched()
            .thenInsertValues({
              gender: 'male',
              first_name: 'Dingo',
              middle_name: 'the',
              last_name: 'Dog',
            })

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = $1 when not matched then insert ("gender", "first_name", "middle_name", "last_name") values ($2, $3, $4, $5)',
              parameters: ['NO_SUCH_PET_NAME', 'male', 'Dingo', 'the', 'Dog'],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = @1 when not matched then insert ("gender", "first_name", "middle_name", "last_name") values (@2, @3, @4, @5);',
              parameters: ['NO_SUCH_PET_NAME', 'male', 'Dingo', 'the', 'Dog'],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })

        describe('And', () => {
          it('should perform a merge...using table simple on...when not matched and simple binary then insert values query', async () => {
            const query = ctx.db
              .mergeInto('person')
              .using('pet', 'pet.owner_id', 'person.id')
              .whenNotMatchedAnd('pet.name', '=', 'Dingo')
              .thenInsertValues({
                gender: 'male',
                first_name: 'Dingo',
                middle_name: 'the',
                last_name: 'Dog',
              })

            testSql(query, dialect, {
              postgres: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and "pet"."name" = $1 then insert ("gender", "first_name", "middle_name", "last_name") values ($2, $3, $4, $5)',
                parameters: ['Dingo', 'male', 'Dingo', 'the', 'Dog'],
              },
              mysql: NOT_SUPPORTED,
              mssql: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and "pet"."name" = @1 then insert ("gender", "first_name", "middle_name", "last_name") values (@2, @3, @4, @5);',
                parameters: ['Dingo', 'male', 'Dingo', 'the', 'Dog'],
              },
              sqlite: NOT_SUPPORTED,
            })

            const result = await query.executeTakeFirstOrThrow()

            expect(result).to.be.instanceOf(MergeResult)
            expect(result.numChangedRows).to.equal(0n)
          })

          it('should perform a merge...using table simple on...when not matched and simple binary ref then insert values query', async () => {
            const query = ctx.db
              .mergeInto('person')
              .using('pet', 'pet.owner_id', 'person.id')
              .whenNotMatchedAndRef('pet.name', '=', 'pet.species')
              .thenInsertValues({
                gender: 'male',
                first_name: 'Dingo',
                middle_name: 'the',
                last_name: 'Dog',
              })

            testSql(query, dialect, {
              postgres: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and "pet"."name" = "pet"."species" then insert ("gender", "first_name", "middle_name", "last_name") values ($1, $2, $3, $4)',
                parameters: ['male', 'Dingo', 'the', 'Dog'],
              },
              mysql: NOT_SUPPORTED,
              mssql: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and "pet"."name" = "pet"."species" then insert ("gender", "first_name", "middle_name", "last_name") values (@1, @2, @3, @4);',
                parameters: ['male', 'Dingo', 'the', 'Dog'],
              },
              sqlite: NOT_SUPPORTED,
            })

            const result = await query.executeTakeFirstOrThrow()

            expect(result).to.be.instanceOf(MergeResult)
            expect(result.numChangedRows).to.equal(0n)
          })

          it('should perform a merge...using table simple on...when not matched and complex and then insert values query', async () => {
            const query = ctx.db
              .mergeInto('person')
              .using('pet', 'pet.owner_id', 'person.id')
              .whenNotMatchedAnd((eb) =>
                eb('pet.name', '=', 'Dingo').and(
                  'pet.name',
                  '=',
                  eb.ref('pet.name'),
                ),
              )
              .thenInsertValues({
                gender: 'male',
                first_name: 'Dingo',
                middle_name: 'the',
                last_name: 'Dog',
              })

            testSql(query, dialect, {
              postgres: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and ("pet"."name" = $1 and "pet"."name" = "pet"."name") then insert ("gender", "first_name", "middle_name", "last_name") values ($2, $3, $4, $5)',
                parameters: ['Dingo', 'male', 'Dingo', 'the', 'Dog'],
              },
              mysql: NOT_SUPPORTED,
              mssql: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and ("pet"."name" = @1 and "pet"."name" = "pet"."name") then insert ("gender", "first_name", "middle_name", "last_name") values (@2, @3, @4, @5);',
                parameters: ['Dingo', 'male', 'Dingo', 'the', 'Dog'],
              },
              sqlite: NOT_SUPPORTED,
            })

            const result = await query.executeTakeFirstOrThrow()

            expect(result).to.be.instanceOf(MergeResult)
            expect(result.numChangedRows).to.equal(0n)
          })

          it('should perform a merge...using table simple on...when not matched and complex or then insert values query', async () => {
            const query = ctx.db
              .mergeInto('person')
              .using('pet', 'pet.owner_id', 'person.id')
              .whenNotMatchedAnd((eb) =>
                eb('pet.name', '=', 'Dingo').or(
                  'pet.name',
                  '=',
                  eb.ref('pet.name'),
                ),
              )
              .thenInsertValues({
                gender: 'male',
                first_name: 'Dingo',
                middle_name: 'the',
                last_name: 'Dog',
              })

            testSql(query, dialect, {
              postgres: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and ("pet"."name" = $1 or "pet"."name" = "pet"."name") then insert ("gender", "first_name", "middle_name", "last_name") values ($2, $3, $4, $5)',
                parameters: ['Dingo', 'male', 'Dingo', 'the', 'Dog'],
              },
              mysql: NOT_SUPPORTED,
              mssql: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched and ("pet"."name" = @1 or "pet"."name" = "pet"."name") then insert ("gender", "first_name", "middle_name", "last_name") values (@2, @3, @4, @5);',
                parameters: ['Dingo', 'male', 'Dingo', 'the', 'Dog'],
              },
              sqlite: NOT_SUPPORTED,
            })

            const result = await query.executeTakeFirstOrThrow()

            expect(result).to.be.instanceOf(MergeResult)
            expect(result.numChangedRows).to.equal(0n)
          })
        })

        it('should perform a merge...using table complex on...when not matched then insert values cross ref query', async () => {
          const query = ctx.db
            .mergeInto('person')
            .using('pet', (on) => on.on('pet.owner_id', 'is', null))
            .whenNotMatched()
            .thenInsertValues((eb) => ({
              gender: 'other',
              first_name: eb.ref('pet.name'),
              middle_name: 'the',
              last_name: eb.ref('pet.species'),
            }))

          testSql(query, dialect, {
            postgres: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" is null when not matched then insert ("gender", "first_name", "middle_name", "last_name") values ($1, "pet"."name", $2, "pet"."species")',
              parameters: ['other', 'the'],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'merge into "person" using "pet" on "pet"."owner_id" is null when not matched then insert ("gender", "first_name", "middle_name", "last_name") values (@1, "pet"."name", @2, "pet"."species");',
              parameters: ['other', 'the'],
            },
            sqlite: NOT_SUPPORTED,
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result).to.be.instanceOf(MergeResult)
          expect(result.numChangedRows).to.equal(3n)
        })
      })

      if (dialect === 'mssql') {
        describe('BySource', () => {
          it('should perform a merge...using table simple on...when not matched by source then delete query', async () => {
            const query = ctx.db
              .mergeInto('person')
              .using('pet', 'pet.owner_id', 'person.id')
              .whenNotMatchedBySource()
              .thenDelete()

            testSql(query, dialect, {
              postgres: NOT_SUPPORTED,
              mysql: NOT_SUPPORTED,
              mssql: {
                sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source then delete;',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            const result = await query.executeTakeFirstOrThrow()

            expect(result).to.be.instanceOf(MergeResult)
            expect(result.numChangedRows).to.equal(0n)
          })

          describe('And', () => {
            it('should perform a merge...using table simple on...when not matched by source and simple binary then delete query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySourceAnd('person.first_name', '=', 'Jennifer')
                .thenDelete()

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source and "person"."first_name" = @1 then delete;',
                  parameters: ['Jennifer'],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })

            it('should perform a merge...using table simple on...when not matched by source and simple binary ref then delete query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySourceAndRef(
                  'person.first_name',
                  '=',
                  'person.last_name',
                )
                .thenDelete()

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source and "person"."first_name" = "person"."last_name" then delete;',
                  parameters: [],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })

            it('should perform a merge...using table simple on...when not matched by source and complex and then delete query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySourceAnd((eb) =>
                  eb('person.gender', '=', 'female').and(
                    'person.first_name',
                    '=',
                    eb.ref('person.last_name'),
                  ),
                )
                .thenDelete()

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source and ("person"."gender" = @1 and "person"."first_name" = "person"."last_name") then delete;',
                  parameters: ['female'],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })

            it('should perform a merge...using table simple on...when not matched by source and complex or then delete query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySourceAnd((eb) =>
                  eb('person.gender', '=', 'female').or(
                    'person.first_name',
                    '=',
                    eb.ref('person.last_name'),
                  ),
                )
                .thenDelete()

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source and ("person"."gender" = @1 or "person"."first_name" = "person"."last_name") then delete;',
                  parameters: ['female'],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })
          })

          describe('update', () => {
            it('should perform a merge...using table simple on...when not matched by source then update set object query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySource()
                .thenUpdateSet({
                  middle_name: 'pet owner',
                })

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source then update set "middle_name" = @1;',
                  parameters: ['pet owner'],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })

            it('should perform a merge...using table simple on...when not matched by source then update set object ref query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySource()
                .thenUpdateSet((eb) => ({
                  first_name: eb.ref('person.last_name'),
                }))

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source then update set "first_name" = "person"."last_name";',
                  parameters: [],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })

            it('should perform a merge...using table simple on...when not matched by source then update set column query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySource()
                .thenUpdateSet('middle_name', 'pet owner')

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source then update set "middle_name" = @1;',
                  parameters: ['pet owner'],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })

            it('should perform a merge...using table simple on...when not matched by source then update set column ref query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySource()
                .thenUpdateSet('first_name', (eb) => eb.ref('person.last_name'))

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source then update set "first_name" = "person"."last_name";',
                  parameters: [],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })

            it('should perform a merge...using table simple on...when not matched by source then update set complex query', async () => {
              const query = ctx.db
                .mergeInto('person')
                .using('pet', 'pet.owner_id', 'person.id')
                .whenNotMatchedBySource()
                .thenUpdate((ub) =>
                  ub
                    .set('first_name', (eb) => eb.ref('person.last_name'))
                    .set({
                      marital_status: 'single',
                    }),
                )

              testSql(query, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched by source then update set "first_name" = "person"."last_name", "marital_status" = @1;',
                  parameters: ['single'],
                },
                sqlite: NOT_SUPPORTED,
              })

              const result = await query.executeTakeFirstOrThrow()

              expect(result).to.be.instanceOf(MergeResult)
              expect(result.numChangedRows).to.equal(0n)
            })
          })
        })
      }
    })

    describe('multiple whens', () => {
      it('should perform a merge...using table simple on...when matched then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()
          .whenNotMatched()
          .thenInsertValues((eb) => ({
            gender: 'other',
            first_name: eb.ref('pet.name'),
            middle_name: 'the',
            last_name: eb.ref('pet.species'),
          }))

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete when not matched then insert ("gender", "first_name", "middle_name", "last_name") values ($1, "pet"."name", $2, "pet"."species")',
            parameters: ['other', 'the'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete when not matched then insert ("gender", "first_name", "middle_name", "last_name") values (@1, "pet"."name", @2, "pet"."species");',
            parameters: ['other', 'the'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(3n)
      })
    })

    if (dialect === 'postgres') {
      it('should perform a merge...using table simple on...when matched then delete returning id query', async () => {
        const expected = await ctx.db.selectFrom('pet').select('id').execute()

        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()
          .returning('pet.id')

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then delete returning "pet"."id"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql(expected)
      })

      it('should perform a merge...using table simple on...when matched then update set name returning {target}.name, {source}.first_name query', async () => {
        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenUpdateSet((eb) => ({
            name: sql`${eb.ref('person.first_name')} || '''s pet'`,
          }))
          .returning([
            'pet.name as pet_name',
            'person.first_name as owner_name',
          ])

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then update set "name" = "person"."first_name" || \'\'\'s pet\' returning "pet"."name" as "pet_name", "person"."first_name" as "owner_name"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql([
          { owner_name: 'Jennifer', pet_name: "Jennifer's pet" },
          { owner_name: 'Arnold', pet_name: "Arnold's pet" },
          { owner_name: 'Sylvester', pet_name: "Sylvester's pet" },
        ])
      })

      it('should perform a merge...using table simple on...when matched then delete returning * query', async () => {
        const expected = await ctx.db
          .selectFrom('pet')
          .innerJoin('person', 'pet.owner_id', 'person.id')
          .selectAll()
          .execute()

        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then delete returning *',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql(expected)
      })

      it('should perform a merge...using table simple on...when matched then delete returning {target}.* query', async () => {
        const expected = await ctx.db.selectFrom('pet').selectAll().execute()

        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()
          .returningAll('pet')

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then delete returning "pet".*',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql(expected)
      })

      it('should perform a merge...using table simple on...when matched then delete returning {source}.* query', async () => {
        const expected = await ctx.db
          .selectFrom('pet')
          .innerJoin('person', 'pet.owner_id', 'person.id')
          .selectAll('person')
          .execute()

        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()
          .returningAll('person')

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then delete returning "person".*',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql(expected)
      })

      it('should perform a merge...using table simple on...when matched then delete returning merge_action(), {target}.name', async () => {
        await ctx.db.connection().execute(async (db) => {
          await ctx.db
            .insertInto('person')
            .values({ first_name: 'Moshe', gender: 'other' })
            .execute()

          await sql`SET session_replication_role = 'replica'`.execute(db)
          await db
            .insertInto('pet')
            .values({
              name: 'Ralph',
              owner_id: 9999,
              species: 'hamster',
            })
            .execute()
          await sql`SET session_replication_role = 'origin'`.execute(db)
        })

        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenUpdateSet(
            'name',
            (eb) => sql`${eb.ref('person.first_name')} || '''s pet'`,
          )
          .whenNotMatched()
          .thenInsertValues((eb) => ({
            name: sql`${eb.ref('person.first_name')} || '''s pet'`,
            owner_id: eb.ref('person.id'),
            species: 'hamster',
          }))
          .whenNotMatchedBySource()
          .thenDelete()
          .returning([mergeAction().as('action'), 'pet.name'])

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then update set "name" = "person"."first_name" || \'\'\'s pet\' when not matched then insert ("name", "owner_id", "species") values ("person"."first_name" || \'\'\'s pet\', "person"."id", $1) when not matched by source then delete returning merge_action() as "action", "pet"."name"',
            parameters: ['hamster'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql([
          { action: 'UPDATE', name: "Jennifer's pet" },
          { action: 'UPDATE', name: "Arnold's pet" },
          { action: 'UPDATE', name: "Sylvester's pet" },
          { action: 'DELETE', name: 'Ralph' },
          { action: 'INSERT', name: "Moshe's pet" },
        ])
      })
    }

    if (dialect === 'mssql') {
      it('should perform a merge top...using table simple on...when matched then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .top(1)
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge top(1) into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete;',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(1n)
      })

      it('should perform a merge top percent...using table simple on...when matched then delete query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .top(50, 'percent')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge top(50) percent into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete;',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(2n)
      })

      it('should perform a merge...using table simple on...when matched then delete output id query', async () => {
        const expected = await ctx.db.selectFrom('pet').select('id').execute()

        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDelete()
          .output('deleted.id')

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then delete output "deleted"."id";',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql(expected)
      })

      it('should perform a merge...using table simple on...when matched then update set name output deleted.name, inserted.name query', async () => {
        const query = ctx.db
          .mergeInto('pet')
          .using('person', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenUpdateSet((eb) => ({
            name: sql`${eb.ref('person.first_name')} + '''s pet'`,
          }))
          .output(['deleted.name as old_name', 'inserted.name as new_name'])

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "pet" using "person" on "pet"."owner_id" = "person"."id" when matched then update set "name" = "person"."first_name" + \'\'\'s pet\' output "deleted"."name" as "old_name", "inserted"."name" as "new_name";',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.eql([
          { old_name: 'Catto', new_name: "Jennifer's pet" },
          { old_name: 'Doggo', new_name: "Arnold's pet" },
          { old_name: 'Hammo', new_name: "Sylvester's pet" },
        ])
      })
    }
  })
}

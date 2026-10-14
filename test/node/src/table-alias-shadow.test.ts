import { expect } from 'chai'
import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from '../../../dist/index.js'
import type { Database } from '../../typings/shared.js'

describe('table alias shadowing existing schema table name', () => {
  const db = new Kysely<Database>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  })

  it('selectFrom: compiles queries correctly when alias shadows existing table name', () => {
    const compiled = db
      .selectFrom('person as pet')
      .select(['pet.id', 'pet.first_name'])
      .where('pet.id', '=', 1 as any)
      .compile()
    expect(compiled.sql).to.equal(
      'select "pet"."id", "pet"."first_name" from "person" as "pet" where "pet"."id" = $1',
    )
  })

  it('updateTable: compiles queries correctly when alias shadows existing table name', () => {
    const compiled = db
      .updateTable('person as pet')
      .set({ first_name: 'Alice' })
      .where('pet.id', '=', 2 as any)
      .compile()
    expect(compiled.sql).to.equal(
      'update "person" as "pet" set "first_name" = $1 where "pet"."id" = $2',
    )
  })

  it('deleteFrom: compiles queries correctly when alias shadows existing table name', () => {
    const compiled = db
      .deleteFrom('person as pet')
      .where('pet.id', '=', 3 as any)
      .compile()
    expect(compiled.sql).to.equal(
      'delete from "person" as "pet" where "pet"."id" = $1',
    )
  })

  it('mergeInto: compiles queries correctly when alias shadows existing table name', () => {
    const compiled = db
      .mergeInto('person as pet')
      .using('person', 'person.id', 'pet.id')
      .whenMatched()
      .thenDoNothing()
      .compile()
    expect(compiled.sql).to.equal(
      'merge into "person" as "pet" using "person" on "person"."id" = "pet"."id" when matched then do nothing',
    )
  })

  it('with (CTE): compiles queries correctly when CTE name shadows existing table name', () => {
    const compiled = db
      .with('pet', (db) => db.selectFrom('person').select(['id', 'first_name']))
      .selectFrom('pet')
      .select('pet.id')
      .compile()
    expect(compiled.sql).to.equal(
      'with "pet" as (select "id", "first_name" from "person") select "pet"."id" from "pet"',
    )
  })
})

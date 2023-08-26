import { expectType } from 'tsd'
import {
  AliasableExpression,
  DatabaseIntrospector,
  Dialect,
  DialectAdapter,
  Driver,
  InferDB,
  Kysely,
  QueryCompiler,
  kysely,
} from '..'
import { Tables } from '../shared'

interface TestTypeConfig {
  boolType: boolean
  bigIntType: number
}

class TestDialect implements Dialect {
  typeConfig?: TestTypeConfig

  createDriver(): Driver {
    throw new Error('Method not implemented.')
  }

  createQueryCompiler(): QueryCompiler {
    throw new Error('Method not implemented.')
  }

  createAdapter(): DialectAdapter {
    throw new Error('Method not implemented.')
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    throw new Error('Method not implemented.')
  }
}

const db = kysely<Tables>().dialect(new TestDialect()).build()
type DB = InferDB<typeof db>

// We've set the boolType type to `boolean` in the type config.
// Test that we get that type from all the places you'd expect.
async function testBooleanTypeConfig(db: Kysely<DB>) {
  const r1 = await db
    .selectFrom('person')
    .select((eb) => [
      eb('age', '>', 60).as('is_senior'),

      eb
        .exists(
          eb
            .selectFrom('pet')
            .whereRef('person.id', '=', 'pet.owner_id')
            .select(eb.lit(1).as('one'))
        )
        .as('has_pets'),

      eb
        .and([
          eb('first_name', '=', 'Jennifer'),
          eb('last_name', '=', 'Aniston'),
        ])
        .as('is_jennifer'),

      eb
        .or([
          eb('first_name', '=', 'Jennifer'),
          eb('last_name', '=', 'Aniston'),
        ])
        .as('is_jennifer_or_aniston'),

      eb('first_name', '=', 'Sylvester')
        .and('last_name', '=', 'Stallone')
        .as('is_sylvester'),

      eb('first_name', '=', 'Sylvester')
        .or('last_name', '=', 'Stallone')
        .as('is_sylvester_or_stallone'),
    ])
    .executeTakeFirstOrThrow()

  expectType<{
    is_senior: boolean
    has_pets: boolean
    is_jennifer: boolean
    is_jennifer_or_aniston: boolean
    is_sylvester: boolean
    is_sylvester_or_stallone: boolean
  }>(r1)
}

// We've set the bigIntType type to `number` in the type config.
// Test that we get that type from all the places you'd expect.
async function testBigintTypeConfig(db: Kysely<DB>) {
  const r1 = await db
    .selectFrom('person')
    .select((eb) => [
      eb.fn.count('id').as('count'),
      eb.fn.countAll().as('count_all'),
    ])
    .executeTakeFirstOrThrow()

  expectType<{
    count: number
    count_all: number
  }>(r1)
}

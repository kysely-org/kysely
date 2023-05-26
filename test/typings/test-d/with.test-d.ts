import { Kysely } from '..'
import { Database } from '../shared'
import { expectType, expectError } from 'tsd'

async function testWith(db: Kysely<Database>) {
  const r1 = await db
    .with('jennifers', (db) =>
      db.selectFrom('person').where('first_name', '=', 'Jennifer').selectAll()
    )
    .with('female_jennifers', (db) =>
      db
        .selectFrom('jennifers')
        .select('first_name')
        .where('gender', '=', 'female')
        .selectAll('jennifers')
        .select(['first_name as fn', 'last_name as ln'])
    )
    .selectFrom('female_jennifers')
    .select(['fn', 'ln'])
    .execute()

  expectType<
    {
      fn: string
      ln: string | null
    }[]
  >(r1)

  const r2 = await db
    .with('jennifers(first_name, ln, gender)', (db) =>
      db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .select(['first_name', 'last_name as ln', 'gender'])
    )
    .selectFrom('jennifers')
    .select(['first_name', 'ln'])
    .execute()

  expectType<
    {
      first_name: string
      ln: string | null
    }[]
  >(r2)

  const r3 = await db
    .withRecursive('jennifers(first_name, ln)', (db) =>
      db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .select(['first_name', 'last_name as ln'])
        // Recursive CTE can refer to itself.
        .union(db.selectFrom('jennifers').select(['first_name', 'ln']))
    )
    .selectFrom('jennifers')
    .select(['first_name', 'ln'])
    .execute()

  expectType<
    {
      first_name: string
      ln: string | null
    }[]
  >(r3)

  // Different columns in expression and CTE name.
  expectError(
    db
      .with('jennifers(first_name, last_name, gender)', (db) =>
        db
          .selectFrom('person')
          .where('first_name', '=', 'Jennifer')
          .select(['first_name', 'last_name'])
      )
      .selectFrom('jennifers')
      .select(['first_name', 'last_name'])
  )
}

async function testManyWith(db: Kysely<Database>) {
  const res = await db
    .with('w1', (eb) => eb.selectFrom('person').select('first_name as fn1'))
    .with('w2', (eb) => eb.selectFrom('person').select('first_name as fn2'))
    .with('w3', (eb) => eb.selectFrom('person').select('first_name as fn3'))
    .with('w4', (eb) => eb.selectFrom('person').select('first_name as fn4'))
    .with('w5', (eb) => eb.selectFrom('person').select('first_name as fn5'))
    .with('w6', (eb) => eb.selectFrom('person').select('first_name as fn6'))
    .with('w7', (qb) => qb.selectFrom('person').select('first_name as fn7'))
    .with('w8', (qb) => qb.selectFrom('person').select('first_name as fn8'))
    .with('w9', (qb) => qb.selectFrom('person').select('first_name as fn9'))
    .with('w10', (qb) => qb.selectFrom('person').select('first_name as fn10'))
    .with('w11', (qb) => qb.selectFrom('person').select('first_name as fn11'))
    .with('w12', (qb) => qb.selectFrom('person').select('first_name as fn12'))
    .with('w13', (qb) => qb.selectFrom('person').select('first_name as fn13'))
    .with('w14', (qb) => qb.selectFrom('person').select('first_name as fn14'))
    .with('w15', (qb) => qb.selectFrom('person').select('first_name as fn15'))
    .with('w16', (qb) => qb.selectFrom('person').select('first_name as fn16'))
    //.with('w17', (qb) => qb.selectFrom('person').select('first_name as fn17'))
    //.with('w18', (qb) => qb.selectFrom('person').select('first_name as fn18'))
    .selectFrom([
      'w1',
      'w2',
      'w3',
      'w4',
      'w5',
      'w6',
      'w7',
      'w8',
      'w9',
      'w10',
      'w11',
      'w12',
      'w13',
      'w14',
      'w15',
      'w16',
      //'w17',
      //'w18',
    ])
    .selectAll()
    .executeTakeFirstOrThrow()

  expectType<{
    fn1: string
    fn2: string
    fn3: string
    fn4: string
    fn5: string
    fn6: string
    fn7: string
    fn8: string
    fn9: string
    fn10: string
    fn11: string
    fn12: string
    fn13: string
    fn14: string
    fn15: string
    fn16: string
    //fn17: string
    //fn18: string
  }>(res)
}

import { createPool } from 'mysql2'
import { Pool } from 'pg'
import * as Tarn from 'tarn'
import * as Tedious from 'tedious'
import {
  Generated,
  Kysely,
  PostgresDialect,
  MysqlDialect,
  sql,
  MssqlDialect,
  QueryCancelledError,
} from '../../dist/esm/index.js'

interface Person {
  id: Generated<number>
  first_name: string
  last_name: string | null
}

interface Database {
  person: Person
}

// Test QueryCancelledError first
console.log('Testing QueryCancelledError...')

const error1 = new QueryCancelledError()
if (
  error1.name !== 'QueryCancelledError' ||
  error1.message !== 'Query was cancelled'
) {
  console.error('QueryCancelledError default test failed')
  process.exit(1)
}

const error2 = new QueryCancelledError('Custom message')
if (
  error2.name !== 'QueryCancelledError' ||
  error2.message !== 'Custom message'
) {
  console.error('QueryCancelledError custom message test failed')
  process.exit(1)
}

if (!(error1 instanceof Error) || !(error1 instanceof QueryCancelledError)) {
  console.error('QueryCancelledError inheritance test failed')
  process.exit(1)
}

console.log('✓ QueryCancelledError tests passed')

const dbs = [
  new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        database: 'kysely_test',
        host: 'localhost',
        user: 'kysely',
        port: 5434,
      }),
    }),
  }),
  new Kysely<Database>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: 'kysely_test',
        host: 'localhost',
        user: 'kysely',
        password: 'kysely',
        port: 3308,
      }),
    }),
  }),
  new Kysely<Database>({
    dialect: new MssqlDialect({
      tarn: {
        ...Tarn,
        options: {
          min: 0,
          max: 10,
        },
      },
      tedious: {
        ...Tedious,
        connectionFactory: () =>
          new Tedious.Connection({
            authentication: {
              options: {
                password: 'KyselyTest0',
                userName: 'sa',
              },
              type: 'default',
            },
            options: {
              connectTimeout: 3000,
              database: 'kysely_test',
              encrypt: false,
              port: 21433,
              trustServerCertificate: true,
            },
            server: 'localhost',
          }),
      },
    }),
  }),
]

if (
  dbs
    .map((db) => db.selectFrom('person').select('id').compile().sql)
    .some(
      (sql) => sql.match(/^select ["`]id["`] from ["`]person["`]$/) === null,
    )
) {
  console.error('bun test failed')
  process.exit(1)
}

const query = sql`select 1`

await Promise.all(dbs.map((db) => query.execute(db)))

// Test query cancellation functionality
console.log('Testing query cancellation...')

// Test 1: Execute with non-aborted signal (should work)
try {
  const controller = new AbortController()
  await Promise.all(
    dbs.map((db) =>
      db
        .selectFrom('person')
        .select('id')
        .limit(1)
        .execute({ signal: controller.signal }),
    ),
  )
  console.log('✓ Execute with non-aborted signal passed')
} catch (error) {
  console.error('Execute with non-aborted signal failed:', error)
  process.exit(1)
}

// Test 2: Execute with already aborted signal (should throw QueryCancelledError)
try {
  const controller = new AbortController()
  controller.abort()

  await dbs[0]
    .selectFrom('person')
    .select('id')
    .limit(1)
    .execute({ signal: controller.signal })

  console.error('Should have thrown QueryCancelledError')
  process.exit(1)
} catch (error) {
  if (error instanceof QueryCancelledError) {
    console.log(
      '✓ Execute with aborted signal correctly threw QueryCancelledError',
    )
  } else {
    console.error('Wrong error type thrown:', error)
    process.exit(1)
  }
}

// Test 3: Test different query builder methods
try {
  const controller = new AbortController()
  controller.abort()

  await dbs[0]
    .selectFrom('person')
    .select('id')
    .executeTakeFirst({ signal: controller.signal })

  console.error('executeTakeFirst should have thrown QueryCancelledError')
  process.exit(1)
} catch (error) {
  if (error instanceof QueryCancelledError) {
    console.log(
      '✓ executeTakeFirst with aborted signal correctly threw QueryCancelledError',
    )
  } else {
    console.error('executeTakeFirst wrong error type:', error)
    process.exit(1)
  }
}

// Test 4: Backward compatibility (no options parameter)
try {
  await Promise.all(
    dbs.map(
      (db) => db.selectFrom('person').select('id').limit(1).execute(), // No options parameter
    ),
  )
  console.log('✓ Backward compatibility (no options) passed')
} catch (error) {
  console.error('Backward compatibility test failed:', error)
  process.exit(1)
}

// Test 5: Empty options object
try {
  await Promise.all(
    dbs.map(
      (db) => db.selectFrom('person').select('id').limit(1).execute({}), // Empty options
    ),
  )
  console.log('✓ Empty options object passed')
} catch (error) {
  console.error('Empty options test failed:', error)
  process.exit(1)
}

console.log('bun test passed')

await Promise.all(dbs.map((db) => db.destroy()))

process.exit(0) // hangs otherwise...

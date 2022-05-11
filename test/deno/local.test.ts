import {
  DummyDriver,
  Generated,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from '../../dist/esm/index.js'

interface Person {
  id: Generated<number>
  first_name: string
  last_name: string | null
}

interface Database {
  person: Person
}

const db = new Kysely<Database>({
  dialect: {
    createAdapter() {
      return new PostgresAdapter()
    },
    createDriver() {
      return new DummyDriver()
    },
    createIntrospector(db: Kysely<unknown>) {
      return new PostgresIntrospector(db)
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler()
    },
  },
})

const query = db.selectFrom('person').select('id')
const sql = query.compile()

if (sql.sql !== 'select "id" from "person"') {
  console.error('deno test failed')
  Deno.exit(1)
}

console.error('local deno test passed')

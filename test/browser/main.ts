import {
  Kysely,
  Generated,
  PostgresAdapter,
  DummyDriver,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from '../../dist/esm/index-nodeless.js'

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
    createIntrospector(db: Kysely<any>) {
      return new PostgresIntrospector(db)
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler()
    },
  },
})

window.addEventListener('load', () => {
  const sql = db.selectFrom('person').select('id').compile()

  const div = document.createElement('span')
  div.id = 'result'
  div.innerHTML = sql.sql
  document.body.appendChild(div)
})

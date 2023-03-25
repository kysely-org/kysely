# Browser

Kysely also runs in the browser. Here's a minimal example:

```ts
import {
  Kysely,
  Generated,
  DummyDriver,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely'

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
      return new SqliteAdapter()
    },
    createDriver() {
      return new DummyDriver()
    },
    createIntrospector(db: Kysely<unknown>) {
      return new SqliteIntrospector(db)
    },
    createQueryCompiler() {
      return new SqliteQueryCompiler()
    },
  },
})

window.addEventListener('load', () => {
  const sql = db.selectFrom('person').select('id').compile()

  const result = document.createElement('span')
  result.id = 'result'
  result.innerHTML = sql.sql

  document.body.appendChild(result)
})
```

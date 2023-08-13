# Browser

Kysely also runs in the browser. Here's a minimal example:

```ts
import {
  kysely,
  Generated,
  DummyDriver,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  sqliteTypeConfig,
} from 'kysely'

interface Person {
  id: Generated<number>
  first_name: string
  last_name: string | null
}

interface Tables {
  person: Person
}

const db = kysely<Tables>()
  .dialect({
    typeConfig: sqliteTypeConfig(),

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
  })
  .build()

window.addEventListener('load', () => {
  const sql = db.selectFrom('person').select('id').compile()

  const result = document.createElement('span')
  result.id = 'result'
  result.innerHTML = sql.sql

  document.body.appendChild(result)
})
```

# Introspecting relation metadata

Extracting metadata about tables and views from your database schema in runtime is possible using the methods in the `instrospection` property of a `Kysely` instance.

The example below uses a PostgreSQL connection to print information about all tables and views found in the database schema:

```ts
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

async function logDatabaseSchema() {
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  })

  const tables = await db().introspection.getTables()
  //        ^?  TableMetadata[]

  console.log({ tables })
}
```

For more information check the docs for details on the interfaces [DatabaseIntrospector](https://koskimas.github.io/kysely/interfaces/DatabaseIntrospector.html) and [TableMetadata](https://koskimas.github.io/kysely/interfaces/TableMetadata.html).

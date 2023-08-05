# Introspecting relation metadata

Extracting metadata about tables and views from your database schema in runtime is possible using the methods in the `instrospection` property of a `Kysely` instance.

The example below uses a PostgreSQL connection to print information about all tables and views found in the database schema:

```ts
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
const { Pool } = pg

async function logDatabaseSchema() {
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  })

  const tables = await db.introspection.getTables()
  //        ^?  TableMetadata[]

  console.log({ tables })
}

logDatabaseSchema()
```

For more information check the docs for details on the interfaces [DatabaseIntrospector](https://kysely-org.github.io/kysely-apidoc/interfaces/DatabaseIntrospector.html) and [TableMetadata](https://kysely-org.github.io/kysely-apidoc/interfaces/TableMetadata.html).

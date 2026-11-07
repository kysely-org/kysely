---
description: 'Use Kysely SQL fragments with bound values, checked references, reusable expressions, and inferred selections, or execute a complete raw statement.'
---

# Raw SQL

Use the [sql template tag](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html) for a SQL expression inside a builder query or for a complete raw statement. A fragment can interpolate bound values, other fragments, and builder expressions.

## A small escape hatch inside a typed query

[Materialize's time-bucket queries](https://github.com/MaterializeInc/materialize/blob/adb829aee5913d08eaccce2aee2e0df31c0a2dfd/console/src/api/materialize/cluster/replicaUtilizationHistory.ts#L150-L200), linked from the homepage, use `date_bin` expressions inside CTEs. The simplified PostgreSQL example below keeps the database-specific expression in one reusable helper:

```ts
import { sql, type ExpressionBuilder } from 'kysely'

interface Database {
  asset: {
    id: number
    owner_id: number
    kind: string
    created_at: Date
  }
}

const bucket = (eb: ExpressionBuilder<Database, 'asset'>) =>
  sql<Date>`date_bin(
    ${'15 minutes'}::interval,
    ${eb.ref('created_at')},
    ${new Date('2000-01-01T00:00:00Z')}
  )`
```

With a configured `Kysely<Database>` instance named `db`:

```ts
const rows = await db
  .selectFrom('asset')
  .select('id')
  .select((eb) => bucket(eb).as('bucket'))
  .where('owner_id', '=', ownerId)
  .orderBy('bucket')
  .execute()
// { id: number; bucket: Date }[]
```

The interval, origin, and owner ID become parameters. `eb.ref('created_at')` checks the reference against the query scope and renders an identifier. Renaming it to a missing column produces a TypeScript error, even though it appears inside a SQL fragment. The surrounding selection, filter, and ordering keep their builder checks.

The `Date` in `sql<Date>` is a supplied result type. It does not verify the SQL, check the function's argument types, or convert the returned value. This example assumes PostgreSQL's driver returns the timestamp as a `Date`. Literal column names written directly inside the template are not checked; use `eb.ref` for checked references.

A database function does not always need a SQL template: `eb.fn<T>('function_name', [...])` can call functions without a dedicated helper. Its name, database signature, and supplied result type still need to be correct.

## Keep composing around the fragment

A fragment is an expression the builder can alias, select, filter on, or combine with other expressions. Fragments can also interpolate subqueries and other fragments; values remain parameters as the pieces compose. You can keep most of a statement in the builder while using SQL text for one operation.

Use `sql.ref`, `sql.table`, and `sql.id` when identifiers are only known at runtime. Those helpers quote identifiers but do not validate them against your `Database` type. `sql.raw` inserts text directly and does not bind or validate it; do not use it to interpolate untrusted values.

For a full statement, `sql<RowType>` can be executed through `.execute(db)`. Its result type is supplied rather than inferred from SQL text. See the [SQL API documentation](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html) for fragment composition, parameter binding, and execution examples.

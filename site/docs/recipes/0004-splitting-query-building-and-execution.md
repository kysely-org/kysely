# Splitting query building and execution

Kysely is primarily a type-safe sql query builder.

It also does query execution, migrations, etc. in order to align with Knex's "batteries
included" approach.

## "Cold" Kysely instances

In order to use Kysely purely as a query builder without database driver dependencies,
you can instantiate it with the built-in `DummyDriver` class:

```ts
import {
  Generated,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
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
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
})
```

This Kysely instance will compile to PostgreSQL sql dialect. You can brew "dummy"
dialects to compile to all kinds of sql dialects (e.g. MySQL). Trying to execute
queries using "cold" kysely instances will return empty results without communicating
with a database.

> "Cold" Kysely instances are not required for the following sections. You can
use "hot" kysely instances, with real drivers, if you want to.

## Compile a query

To compile a query, simply call `.compile()` at the end of the query building chain:

```ts
const compiledQuery = db
  .selectFrom('person')
  .select('first_name')
  .where('id', '=', id)
  .compile()

console.log(compiledQuery) // { sql: 'select "first_name" from "person" where "id" = $1', parameters: [1], query: { ... } }
```

The result of `.compile()` is a `CompiledQuery` object. It contains the query string
(in `sql` field), parameters and the original Kysely-specific syntax tree used
for compilation.

This output alone can be used with any database driver that understands the sql
dialect used (PostgreSQL in this example).

Raw queries can be compiled as well:

```ts
import { Selectable, sql } from 'kysely'

const compiledQuery = sql<Selectable<Person>>`select * from person where id = ${id}`.compile(db)

console.log(compiledQuery) // { sql: 'select * from person where id = $1', parameters: [1], query: { ... } }
```

## Infer result type

Kysely supports inferring a (compiled) query's result type even when detached from
query building chains. This allows splitting query building, compilation and execution
code without losing type-safety.

```ts
import { InferResult } from 'kysely'

const query = db
  .selectFrom('person')
  .select('first_name')
  .where('id', '=', id)

type QueryReturnType = InferResult<typeof query> // { first_name: string }[]

const compiledQuery = query.compile()

type CompiledQueryReturnType = InferResult<typeof compiledQuery> // { first_name: string }[]
```

## Execute compiled queries

The `CompiledQuery` object returned by `.compile()` can be executed
via "hot" Kysely instances (real drivers in use):

```ts
const compiledQuery = db
  .selectFrom('person')
  .select('first_name')
  .where('id', '=', id)
  .compile()

const results = await db.executeQuery(compiledQuery)
```

The `QueryResult` object returned by `.executeQuery()` contains the query results'
rows, insertId and number of affected rows (if applicable).
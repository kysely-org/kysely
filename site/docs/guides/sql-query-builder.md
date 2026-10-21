---
title: SQL query builders in TypeScript
sidebar_label: SQL query builders
sidebar_position: 1
description: 'Learn what a SQL query builder does with TypeScript and generated SQL examples. Compare Kysely with raw SQL and ORMs, and build your first typed query.'
---

# SQL query builders in TypeScript

A SQL query builder is a library that constructs SQL statements through a programming language API. You choose tables, columns, joins, and filters in code; the builder produces SQL and passes values to your database as parameters.

Kysely is an open-source SQL query builder for TypeScript. It uses your database types to check queries as you write them and infer the shape of their results. It supports PostgreSQL, MySQL, SQL Server, SQLite, and [other databases through dialects](../dialects.md).

## From TypeScript to SQL

Suppose your database has a `person` table and a `pet` table. With a configured `Kysely<Database>` instance named `db`, you can select people and their pets like this:

```ts
const query = db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.first_name', 'pet.name as pet_name'])
  .where('person.age', '>=', 18)
  .orderBy('person.first_name')
```

For PostgreSQL, `query.compile()` produces this SQL and a separate parameters array:

```sql
select "person"."first_name", "pet"."name" as "pet_name"
from "person"
inner join "pet" on "pet"."owner_id" = "person"."id"
where "person"."age" >= $1
order by "person"."first_name"
```

```ts
const parameters = query.compile().parameters
// [18]
```

Call `await query.execute()` to send the query to your database. Given non-nullable string columns for both names, TypeScript infers the result as:

```ts
type Result = { first_name: string; pet_name: string }[]
```

The alias becomes a property of the result type. A misspelled table or column produces a TypeScript error, and changing the selection changes the inferred result.

## Try a complete example

This example assumes PostgreSQL is running and `DATABASE_URL` points to a database with a `person` table containing `id`, `first_name`, and `age` columns. Kysely does not create tables from TypeScript interfaces.

Install Kysely and the PostgreSQL driver:

```sh
npm install kysely pg
npm install --save-dev typescript @types/node @types/pg
```

Enable `strict` mode in your TypeScript configuration, then configure a dialect and define the database types:

```ts
import { Kysely, PostgresDialect } from 'kysely'
import type { Generated } from 'kysely'
import { Pool } from 'pg'

interface Database {
  person: {
    id: Generated<number>
    first_name: string
    age: number | null
  }
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
})

try {
  const people = await db
    .selectFrom('person')
    .select(['id', 'first_name'])
    .where('age', '>=', 18)
    .orderBy('first_name')
    .execute()

  // people: { id: number; first_name: string }[]
  console.log(people)
} finally {
  await db.destroy()
}
```

This is a standalone script, so it closes the connection pool when it finishes. In a server, [share a Kysely instance and destroy it during shutdown](../getting-started.mdx#instantiation), rather than after each request.

For other drivers and runtimes, follow the [getting started guide](../getting-started.mdx). For an existing database, [generate the types from its schema](../generating-types.md) instead of maintaining them by hand.

## Query builder, raw SQL, or ORM?

These approaches give you different ways to express database operations. The right choice depends on how much control you want over SQL and which abstractions your application needs.

| Approach          | How you write queries                                                            | What to consider                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw SQL           | SQL strings or tagged templates, with parameters supplied separately             | Direct control over database features; typing and composing query fragments depend on your tooling.                                         |
| SQL query builder | Function calls that represent SQL clauses                                        | Useful for composing queries in application code. Kysely checks table and column references and infers result types from your schema types. |
| ORM               | Model and relation APIs, often alongside a query builder or raw SQL escape hatch | Useful when you want object mapping and relation operations. Behavior and SQL control vary between ORMs.                                    |

Choose Kysely when you want to think in SQL, compose queries using TypeScript functions, and get compiler feedback while editing them. If your application needs automatic change tracking or model lifecycle hooks, evaluate an ORM that provides those features.

Already using a query builder? [Kysely vs Knex](./kysely-vs-knex.md) shows the same query in both libraries and explains the differences in type inference and query reuse.

## Parameters and raw SQL

Values passed to methods such as `.where('first_name', '=', name)` become query parameters. Kysely keeps those values separate from the generated SQL.

For database-specific expressions, use the `sql` template tag:

```ts
import { sql } from 'kysely'

const name = 'Jennifer'
const people = await sql<{ id: number; first_name: string }>`
  select id, first_name from person where first_name = ${name}
`.execute(db)

console.log(people.rows)
```

Here, `${name}` becomes a parameter. The result type supplied to `sql` is your assertion: Kysely does not parse the raw SQL to verify its columns or result shape. Helpers such as `sql.raw` insert SQL text directly, so keep untrusted input out of them. See [raw SQL](../recipes/0003-raw-sql.md) for details.

## What type safety covers

Kysely checks queries against the TypeScript database types you provide. It does not check your live database schema during compilation, validate returned values at runtime, or guarantee that a query is fast. Keep schema types current and check query plans for performance-sensitive queries.

You can build queries without executing them, too. [Splitting query building and execution](../recipes/0004-splitting-query-building-and-execution.md) explains how to compile SQL without a database connection.

## Keep going

- [Get started with Kysely](../getting-started.mdx): configure your database and write your first query.
- [Query examples](/docs/category/examples): explore selects, joins, inserts, updates, and transactions.
- [Kysely vs Knex](./kysely-vs-knex.md): compare APIs and plan an incremental migration.

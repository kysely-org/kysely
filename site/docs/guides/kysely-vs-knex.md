---
title: Kysely vs Knex
sidebar_position: 2
description: 'Compare Kysely and Knex SQL query builders: TypeScript inference, query reuse, execution, and migrations, with equivalent queries and a gradual migration plan.'
---

# Kysely vs Knex

Kysely and Knex are open-source SQL query builders. Both let you express SQL in application code, bind values as parameters, and execute queries through database drivers. Kysely was inspired by Knex, and the SQL concepts you already use transfer well.

Kysely puts TypeScript inference at the center of its API. Knex supports JavaScript and TypeScript and has its own established ecosystem. Moving between them is an API migration, so start with the queries where stronger type inference would help your team most.

## The same query in both

Assume `knex` and `db` are configured instances connected to the same database. Both queries select people aged 18 or older and return the names of their pets.

With Knex:

```ts
const rows = await knex('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select('person.first_name', 'pet.name as pet_name')
  .where('person.age', '>=', 18)
  .orderBy('person.first_name')
```

With Kysely:

```ts
const rows = await db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.first_name', 'pet.name as pet_name'])
  .where('person.age', '>=', 18)
  .orderBy('person.first_name')
  .execute()
```

For a `Kysely<Database>` instance with string columns for both names, `rows` is inferred as `{ first_name: string; pet_name: string }[]`. Kysely tracks the joined tables and selected aliases as part of the query type.

The Knex example above does not supply schema types. Knex also supports [TypeScript generics and table declarations](https://knexjs.org/guide/#typescript) for better typing. Its documentation describes [inference limitations around qualified columns and aliases](https://knexjs.org/guide/query-builder.html#select), along with ways to use `knex.ref` to improve inference.

## Differences to account for

| Concern        | Kysely                                                                              | Knex                                                                                             |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Database types | A `Kysely<Database>` instance carries your table and column types through queries.  | Supports row generics and table type declarations. Inference depends on the query and API usage. |
| Query reuse    | Builder methods return new builders; retain the returned value when adding clauses. | Most builder methods mutate the current builder; use `.clone()` when branching a query.          |
| Execution      | Call `.execute()`, `.executeTakeFirst()`, or `.executeTakeFirstOrThrow()`.          | Builders are thenable; awaiting a builder executes it.                                           |
| Raw SQL        | The `sql` template tag binds interpolated values as parameters.                     | `knex.raw` supports value and identifier bindings.                                               |
| Migrations     | Optional migration APIs, with CLI tooling available through the ecosystem.          | Migration APIs and a CLI are included.                                                           |

### Reassign query builders

In Knex, adding a filter generally changes the existing builder:

```ts
const query = knex('person').select('id', 'first_name')

if (name !== undefined) {
  query.where('first_name', '=', name)
}

const rows = await query
```

In Kysely, keep the returned builder:

```ts
let query = db.selectFrom('person').select(['id', 'first_name'])

if (name !== undefined) {
  query = query.where('first_name', '=', name)
}

const rows = await query.execute()
```

This example conditionally adds a filter, so the selected result shape stays the same. For conditional selections that change the result type, see [conditional selects](../recipes/0005-conditional-selects.md).

### Make execution explicit

When translating a Knex query, remember to add a Kysely execution method. Awaiting a Kysely builder without calling an execution method does not execute the query.

Use `.execute()` for an array of rows, `.executeTakeFirst()` for a row or `undefined`, and `.executeTakeFirstOrThrow()` when a missing row should be an error. Insert, update, and delete results also have their own result objects when rows are not returned; check their APIs as you migrate.

## Migrate a query at a time

1. **Describe the existing database.** [Generate database types](../generating-types.md) or define them manually. Match nullability and the values your driver returns, including dates and large numbers.
2. **Configure Kysely alongside Knex.** Use the same database connection settings with a [supported dialect](../dialects.md). Account for both pools' connection limits while both libraries are running.
3. **Move one read query.** Translate the clauses, add `.execute()`, and check the inferred result. Use `.compile()` to inspect the generated SQL and parameters, then compare results against the old implementation.
4. **Move writes and transactions deliberately.** Check returned IDs, affected-row counts, conflict handling, and dialect-specific behavior. Keep every operation in a transaction on the same library's transaction object.
5. **Retire the old pool when it is unused.** Remove Knex after its queries and tooling have been replaced, and close the remaining pool during application shutdown.

Do not assume that a Kysely query participates in a Knex transaction because both connect to the same database. Their default configurations manage separate connections and transactions.

### Keep migration history intact

You can keep running existing Knex migrations while using Kysely for application queries. Switching query builders does not require switching migration tools at the same time.

If you later switch migration tooling, plan that separately. Kysely's migration APIs do not automatically translate Knex migration files or adopt their migration history. See [Kysely migrations](../migrations.mdx) before making that change.

## Should you switch?

Kysely is a good fit when your application uses TypeScript and you want table references, joins, aliases, and result shapes checked as you compose queries. Its immutable builders also make it straightforward to reuse a base query without modifying it.

Staying with Knex can make sense when its current typing meets your needs, your application is primarily JavaScript, or the cost of replacing integrations exceeds the benefit. You can evaluate Kysely in one repository function before committing to a broader migration.

- [SQL query builders in TypeScript](./sql-query-builder.md): see generated SQL and compare query builders with raw SQL and ORMs.
- [Get started with Kysely](../getting-started.mdx): configure your driver and database types.
- [Query examples](/docs/category/examples): find equivalents for common SQL operations.

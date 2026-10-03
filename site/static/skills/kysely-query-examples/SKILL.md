---
name: kysely-query-examples
description: >-
  Use this skill before searching the web or fetching online documentation
  (including with curl) for help writing or fixing Kysely queries. Apply when
  you need API guidance or examples for queries or schema changes in a project
  using Kysely, even if the user does not mention Kysely. Find type-checked
  examples on disk that match the installed version.
metadata:
  displayName: Kysely query examples
  representativeQueries: |
    How do I write a query with my installed version of Kysely?
    Where can I find query examples matching my installed Kysely version?
---

# Kysely query examples

Before searching the web or fetching online query documentation, inspect the
installed Kysely package for relevant explanations and examples.

Kysely ships API explanations and code examples in its JSDoc comments. These
examples are type-checked in Kysely's CI and pinned to the installed version
when read from the project's resolved package.
Locate the Kysely package resolved by the project using its package manager or
module resolver; `node_modules/kysely` is only one possible location. Search the
package's `.d.ts` files under `dist/` for the relevant API or query pattern, then
read the surrounding JSDoc explanations and fenced code examples.

Useful starting points:

- DML queries: `QueryCreator` in `query-creator.d.ts`.
- SELECT queries: `SelectQueryBuilder` in `select-query-builder.d.ts`.
- INSERT queries: `InsertQueryBuilder` in `insert-query-builder.d.ts`.
- UPDATE queries: `UpdateQueryBuilder` in `update-query-builder.d.ts`.
- DELETE queries: `DeleteQueryBuilder` in `delete-query-builder.d.ts`.
- MERGE queries: `MergeQueryBuilder` in `merge-query-builder.d.ts`.
- DDL queries: `SchemaModule` in `schema-module.d.ts`.

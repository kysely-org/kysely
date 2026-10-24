# PostgreSQL comparison checks

Reproduce the Prisma 7, Knex, raw-SQL, and SQL-file comparison examples using
the published package versions pinned in `package.json`.

From this directory:

```sh
npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund
COMPARISON_DATABASE_URL=postgres://user:password@localhost:5432/test npm test
```

Use a disposable PostgreSQL server. The test user needs permission to create
databases and schemas. Fixtures use uniquely named temporary databases/schemas
and remove them in `finally` blocks. Generated Prisma files and comparison
dependencies stay local to this standalone package.

The runner rejects version drift, generates Prisma Client and TypedSQL, runs
PostgreSQL assertions, and checks all fixtures with strict TypeScript 6 and 7.
It also checks that the documented functions and SQL files match the fixtures.
`skipLibCheck` skips third-party declaration internals; fixture expressions and
inferred types are checked. Expected errors use `@ts-expect-error`, so a missing
error fails the check.

- `scenarios.mts`: equivalent leaderboards, related-author aggregate thresholds,
  filtering before pagination, Prisma's filtered relation counts and SQL escape
  hatch, recursive permission lookups, registered Knex table types, join/alias
  inference, invalid references, mutation, `.clone()`, async execution, and
  first-row behavior.
- `knex-semantics.mts`: PostgreSQL/MySQL upsert compilation, JSON function
  compilation across PostgreSQL/MySQL/SQLite, raw bindings, built-in ranking,
  and `knex.ref()` inference. MySQL and SQLite statements are compiled only.
- `raw-scenarios.mts`: 48 option combinations through Kysely, Postgres.js,
  Slonik with result validation, and newly generated Prisma TypedSQL. Also
  checks selected-key absence, nested JSON, result-type drift, CASE output,
  a 50-row page with a 60-row total, and bound SQL-like input.

The SQL-file execution checks cover Prisma TypedSQL. References to SafeQL,
Reylo, PgTyped, and sqlc describe their documented capabilities; these tools
are not executed by this suite.

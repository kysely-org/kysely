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
When comparison pages are present, it also checks their documented functions and SQL files against the fixtures. The pages are maintained in separate PRs; without them, only documentation parity is skipped.
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

## Cumulative PostgreSQL measurements

The ORM chart compares complete PostgreSQL package setups, including `pg` 8.23.1 and hard dependencies. Prisma includes the CLI, client, and PostgreSQL adapter; MikroORM includes its core and PostgreSQL driver; Sequelize includes `pg-hstore`.

```sh
node site/scripts/measure-postgres-footprints.mjs site/scripts/postgres-footprints.json
```

Run this from the repository root. npm resolves required peers; optional and dev dependencies are omitted. Compressed totals count each unique package version once. Unpacked totals count each dependency placement, including duplicate copies. Tarball integrity is checked before sizes are recorded. For older packages missing unpacked-size metadata, regular-file bytes are counted from the archive.

The recorded report includes roots, resolved placements, package versions, and per-package sizes. Install scripts are disabled, so their extra downloads and generated application code are excluded. These are npm package payloads, not bundle sizes or performance benchmarks.

## Package-only measurements

From the repository root, reproduce the pinned package downloads and PostgreSQL dependency trees:

```sh
node site/scripts/measure-package-footprints.mjs /tmp/kysely-package-footprints.json
```

The recorded report is `site/scripts/package-footprints.json`. The script downloads package metadata and tarballs and resolves production trees using temporary npm projects, with install scripts disabled. Its report includes the measurement time and methodology; these values are not application bundle sizes.

Later package additions carry their own `measuredAt` timestamps. Dependency-tree counts retain the original report timestamp; package-only measurements exclude dependencies and drivers.

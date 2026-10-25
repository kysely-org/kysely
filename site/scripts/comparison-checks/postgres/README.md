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

The ORM chart compares code-first PostgreSQL development setups: hand-authored schema/model definitions, migrations, querying, and required code generation. Every setup includes `pg` 8.23.1 and transitive dependencies.

| Setup | Explicit packages beyond `pg` | Schema/migration workflow |
| --- | --- | --- |
| Kysely | `kysely` 0.29.7, `kysely-ctl` 0.22.0, `kysely-typegen` 2.1.0 | Bundled schema builder and migration APIs, CLI migration authoring/execution, and database types generated programmatically from PostgreSQL. |
| Knex | `knex`, `ts-node` 10.9.2 | Bundled schema builder and migration CLI, with ts-node loading TypeScript configuration/migrations. |
| Drizzle | `drizzle-orm`, `drizzle-kit` | Hand-authored table definitions; Kit generates and runs migrations. |
| Prisma 7 | `@prisma/client`, `@prisma/adapter-pg`, `prisma` | Hand-authored Prisma schema; CLI migrates and generates client code. |
| TypeORM | `typeorm`, `ts-node` 10.9.2 | Hand-authored entities; bundled CLI generates and runs migrations, with ts-node loading TypeScript sources. |
| Sequelize | `sequelize`, `sequelize-cli`, `pg-hstore`, `ts-node` 10.9.2 | CLI scaffolds JavaScript migrations and discovers TypeScript migrations; ts-node is registered to execute TypeScript sources. |
| MikroORM | `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/cli`, `@mikro-orm/migrations`, `jiti` 2.7.0 | Hand-authored entities; CLI generates and runs migrations, with jiti loading TypeScript migrations. |

Package choices follow the official [Kysely](https://kysely.dev/docs/migrations) and [kysely-ctl](https://github.com/kysely-org/kysely-ctl), with [kysely-typegen](https://github.com/theoludwig/kysely-typegen) for database type generation, [Knex](https://knexjs.org/guide/migrations.html), [Drizzle](https://orm.drizzle.team/docs/drizzle-kit-generate), [TypeORM](https://typeorm.io/docs/migrations/executing/), [Sequelize](https://sequelize.org/docs/v6/other-topics/migrations/), and [MikroORM](https://mikro-orm.io/docs/guide/project-setup) migration workflows. MikroORM includes the supported [jiti TypeScript loader](https://mikro-orm.io/docs/typescript-loaders), matching the loader installed by kysely-ctl. Knex, TypeORM, and Sequelize include ts-node and its required peers. TypeScript 6.0.3 is installed to satisfy its compiler API requirement, but is assumed shared tooling and excluded from package counts and both size totals for every setup. Excluded placements remain recorded in the report. Sequelize CLI 6.6.5 discovers `.ts`/`.cts` migrations ([source](https://github.com/sequelize/cli/blob/v6.6.5/src/core/migrator.js)); its TypeScript setup registers `ts-node/register` (for example, in `.sequelizerc`). Prisma is pinned to version 7; its CLI/client generation is also exercised by this suite.

```sh
node site/scripts/measure-postgres-footprints.mjs site/scripts/postgres-footprints.json
```

Run this from the repository root. A real npm install with scripts disabled records the packages actually installed on the report's OS/architecture. This includes required peers and compatible optional dependencies, including packaged native tool binaries. CLI and migration tools are explicit roots even if an application would put them in `devDependencies`; their transitive development dependencies are not installed.

Compressed totals count each unique package version once. Unpacked totals count each dependency placement, including duplicate copies. Tarball integrity is checked before sizes are recorded. For older packages missing unpacked-size metadata, regular-file bytes are counted from the archive.

The report records roots, installed placements, package versions, platform, and per-package sizes. TypeScript is always excluded from the totals, including compiler peers pulled in by tools. Shared Node.js and application type declarations are outside the comparison unless pulled in by a tool. Kysely database types are generated with `kysely-typegen`; the other setups use hand-authored model/table definitions, with Prisma's mandatory client generator included. Additional generators (such as `kysely-codegen`), seeding tools, and unrelated integrations are excluded.

Install scripts are disabled, so extra downloads and generated application code are excluded. These are accumulated npm package payloads for development, not deployed bundle sizes, complete disk usage, or performance benchmarks.

## Package-only measurements

From the repository root, reproduce the pinned package downloads and PostgreSQL dependency trees:

```sh
node site/scripts/measure-package-footprints.mjs /tmp/kysely-package-footprints.json
```

The recorded report is `site/scripts/package-footprints.json`. The script downloads package metadata and tarballs and resolves production trees using temporary npm projects, with install scripts disabled. Its report includes the measurement time and methodology; these values are not application bundle sizes.

Later package additions carry their own `measuredAt` timestamps. Dependency-tree counts retain the original report timestamp; package-only measurements exclude dependencies and drivers.

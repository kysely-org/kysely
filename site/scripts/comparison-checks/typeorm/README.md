# TypeORM comparison checks

These checks reproduce the examples in `site/docs/comparisons/kysely-vs-typeorm.mdx` using published Kysely 0.29.7, TypeORM 1.1.1 and 0.3.31, and pg 8.23.1.

From this directory:

```sh
npm install --ignore-scripts --workspaces=false --package-lock=false
COMPARISON_DATABASE_URL=postgres://user:password@localhost:5432/disposable_database npm test
```

Use a disposable PostgreSQL database. The user needs permission to create schemas. Each run creates a uniquely named schema and removes it in `finally`; TypeORM's schema synchronization is disabled. No application tables are used.

The runner checks package versions, documented snippets, and strict TypeScript 6.0.3/7.0.2 compilation against each TypeORM release. `#typeorm-under-test` is a package import with a `legacy` condition, so the same source runs and compiles against both releases.

Runtime assertions cover:

- Equivalent joined projections and grouped counts.
- A renamed raw projection with a stale generic result type.
- A partial entity whose unselected property remains typed as present.
- Unjoined, misspelled, aliased, and incompatible-value references rejected by PostgreSQL; corresponding Kysely errors are checked with `@ts-expect-error`.
- Shared builder mutation, TypeORM's `.clone()` remedy, and independent Kysely branches.
- Colliding named parameters and both corrected implementations.
- TypeORM relationship hydration, empty related arrays, a CTE, and row locking inside a transaction.

These checks establish the behavior of these examples and versions, not every API or database supported by either library.

# Sequelize comparison checks

These checks reproduce `site/docs/comparisons/kysely-vs-sequelize.mdx` using published Kysely 0.29.7, Sequelize 6.37.8, `@sequelize/core` / `@sequelize/postgres` 7.0.0-alpha.48, and pg 8.23.1.

From this directory:

```sh
npm install --ignore-scripts --workspaces=false --package-lock=false
COMPARISON_DATABASE_URL=postgres://user:password@localhost:5432/disposable_database npm test
```

Use a disposable PostgreSQL database. The user needs CREATE SCHEMA privileges. Each fixture creates a unique schema and drops it in `finally`; Sequelize synchronization is not used. Application tables are not used.

The runner verifies package versions, documented snippets, and strict TypeScript 6.0.3/7.0.2 checks against both releases. `#sequelize-under-test` selects the Sequelize 6 adapter by default and the v7 adapter with Node's `sequelize7` condition. The adapters account for constructor and scope API differences.

Runtime assertions cover:

- Equivalent grouped reports using Sequelize's built-in aggregate helpers, bound raw SQL, and Kysely, at four thresholds, including zero related rows and empty results.
- Renamed attributes and partially selected models retaining stale declared fields.
- Typed object filters rejecting unknown attributes, while `col` accepts unjoined or misspelled references that PostgreSQL rejects.
- Independent Kysely query branches, Sequelize eager loading, empty related arrays, and reusable model scopes.
- Sequelize 7's SQL tag, interpolated values, `sql.attribute`, explicit raw model result types, and stale result annotations.

Type checks assert Kysely's inferred report and alias types, and ensure invalid references fail with `@ts-expect-error`. The v7 alpha findings describe this pinned prerelease, not a future stable v7.

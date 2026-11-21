# Sequelize comparison checks

Reproduce the examples in `site/docs/comparisons/kysely-vs-sequelize.mdx` using
published Kysely 0.29.8, Sequelize 6.37.8, and Sequelize 7.0.0-alpha.48
(`@sequelize/core` with `@sequelize/postgres`). The runner rejects version
drift, type-checks every fixture with strict TypeScript 6 and 7 against each
release (the `alpha` import condition selects 7.0.0-alpha.48 through
`_v7.mts`), then runs each fixture twice against a disposable PostgreSQL
server, once per release.

From this directory:

```sh
npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund
COMPARISON_DATABASE_URL=postgres://user:pass@localhost:5432/db npm test
```

Each run creates its own schema and drops it afterwards; the user needs
`CREATE SCHEMA`. `types/*.v6.mts` and `types/*.v7.mts` hold the type assertions
that differ between the releases. Expected Kysely errors use
`@ts-expect-error`, which fails compilation if an expected error disappears.
Invalid Sequelize expressions compile without suppression, and assertions record
the PostgreSQL error code that rejects each.

| Fixture           | Evidence |
| ----------------- | -------- |
| `scope.mts`       | The same grouped pet count from a finder and from Kysely (rows equal, Kysely's `count` typed `string \| number \| bigint`, the finder's rows typed as the model); invalid references that pass TypeScript in Sequelize and reach PostgreSQL (`col()` on an unincluded table and `$nested$` (`42P01`), misspelled `order`, `group`, and `col()` names (`42703`)), an unknown association alias thrown by Sequelize, a string compared with an integer (`22P02` on 6.37.8, refused by 7.0.0-alpha.48), a typed `where` key, each a type error in Kysely; an include removed while a collected `$pets.name$` filter stays (`42P01` only with the option). `types/results.*.mts`: raw results typed `Person[]` (6.37.8) or `InferAttributes<Person>[]` (7.0.0-alpha.48), no `pet_count`, a misspelled attribute compiling on 6.37.8 only. |
| `results.mts`     | A renamed attribute typed under its old name and `undefined` at runtime, a partial `findByPk` typed as the whole model, `raw: true` with an include returning one row per pet under dotted keys, a hydrated include in one statement, `separate: true` in two, an include `where` dropping the people with no matching pet unless `required: false`, and Kysely's inferred rows and `jsonArrayFrom`. |
| `composition.mts` | A caller's `where` replacing a scope's condition on the same attribute on 6.37.8 (joined with AND on 7.0.0-alpha.48, and on 6.37.8 with `whereMergeStrategy: 'and'`), Kysely's `where()` adding and builders not changing, `findAndCountAll()` with an include counting 5 rows for 4 people in two statements unless `distinct: true`, an include with a limit paging parents, `$nested$` with a limit failing (`42P01`), the per-person target report failing with the default `subQuery` (`42P01`) and running with `subQuery: false`, and Kysely's page and total in one statement. |
| `binding.mts`     | Finder and `destroy()` values written into the statement text as escaped literals while `update()` binds them (checked on the `pg` client), Kysely binding every value, a failed finder query carrying its statement and values as enumerable properties, the 6.37.8 default logger printing statements with `console.log` (silent on 7.0.0-alpha.48), no `signal` find option, and a Kysely query aborted by an `AbortSignal`. |
| `rewrites.mts`    | A paranoid `destroy()` as an `UPDATE`, an include of a paranoid model adding `"deleted_at" IS NULL` to the join condition so a soft-deleted owner reads `null`, `include.paranoid: false`, a raw query sent as written, and Kysely compiling the join as written. |
| `coverage.mts`    | `UNION`, CTEs, window functions, `FILTER`, lateral joins, `DISTINCT ON`, a subquery in the selection, `MERGE`, and `DELETE ... USING` built and run in Kysely; Sequelize's `upsert()` with `ON CONFLICT` and `RETURNING`, `SKIP LOCKED`, savepoints for nested callback transactions, and 7.0.0-alpha.48 joining a query to the surrounding transaction without passing it. |
| `bridge.mts`      | kysely-sequelize 0.2.0 running Kysely over a Sequelize 6.37.8 instance with `KyselifyModel` table types (skipped on 7.0.0-alpha.48, which its peer range excludes). |
| `kysely-gaps.mts` | Kysely compiling `= null` and a union with reordered columns, the references it takes on trust (`sql.ref`, template text, a dynamic reference, a standalone expression builder), the join shorthand comparing names only, and an unqualified shared column rejected as ambiguous at runtime. |

These fixtures do not test transports other than node-postgres, do not measure
performance, and do not prove the absence of every possible API. Missing-method
claims also require reviewing the published declarations and official docs for
the pinned versions.

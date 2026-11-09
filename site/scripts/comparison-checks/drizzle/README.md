# Drizzle comparison checks

Reproduce the examples in `site/docs/comparisons/kysely-vs-drizzle.mdx` using
published Kysely 0.29.7, Drizzle 0.45.4, and Drizzle 1.0.0-rc.5. The runner
rejects version drift, type-checks every fixture with strict TypeScript 6 and 7,
then runs assertions against an in-memory PGlite PostgreSQL engine.

From this directory:

```sh
npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund
npm test
```

The standalone package keeps comparison dependencies out of the site's runtime.
`skipLibCheck` skips third-party declaration internals; fixture expressions and
inferred types are checked. Expected Kysely errors use `@ts-expect-error`, which
fails compilation if an expected error disappears. Invalid Drizzle expressions
compile without suppression, and assertions distinguish errors during SQL
generation from errors in PostgreSQL.

| Fixture | Evidence |
| --- | --- |
| `stable.mts`, `rc.mts` | Unjoined selections, predicates, and underlying-table references after a subquery alias. |
| `operator-inputs.mts` | Incompatible column expressions, non-boolean inputs, `like` on an integer column, literal checks, and references inside SQL fragments. |
| `immutable.mts` | Shared-builder mutation and fresh-builder workarounds through both Drizzle clients. |
| `json-traversal.mts` | Matching JSON results, empty arrays, misspelled keys, invalid traversal, and exact Kysely output types. |
| `case-builder.mts` | CASE results, null ages, omitted ELSE, inferred nullability, and invalid branch structure. |
| `relations-json.mts` | SQL-style JSON aggregation, ordering, per-parent limits, empty arrays, explicit aliases, and the manual-wrapper alias mismatch. |
| `coverage-comparison.mts` | Aggregate FILTER, window ranks with ties, and invalid partition references. |
| `built-in-alternatives.mts` | Drizzle relational queries with ordered/limited nested pets, both built-in single-count alternatives, and simultaneous FILTER aggregates. |
| `extensibility.mts` | Join deduplication and Drizzle's published PostgreSQL proxy dialect factory. |
| `shared-queries.mts` | Matching left-join rows and inferred types (also through 0.45's `Kyselify`), the 1.0 relational query beside `jsonArrayFrom`, a second `where()` rejected outside dynamic mode and replacing the first inside it, awaited async helpers, `withSchema`, and Kysely's ambiguous unqualified reference. |
| `join-shapes.mts` | Drizzle's left-joined nested object typed and returned as `null` as a whole; Kysely's joined columns nullable one by one. |
| `dialect-types.mts` | `returning()` compiling on a Kysely MySQL instance, and absent from Drizzle's MySQL insert builder in types and at runtime. |
| `removed-join.mts` | A join removed while collected filters still read its table: compiling, running without the option, and failing with it in Drizzle; rejected by Kysely in the chain, in a helper typed with that table, and in a reference passed as an expression; accepted by a Kysely helper typed with a union of tables. |
| `statement-scope.mts` | Another table's column in ORDER BY, GROUP BY, HAVING, SET, and a delete's WHERE, a CTE that was never attached, and `returning()` resolving another table's column against the target table. |
| `kysely-gaps.mts` | Kysely compiling `= null` and a union with reordered columns, where Drizzle rejects the first via types and throws on the second. |

PGlite tests PostgreSQL execution semantics without a server. These fixtures do
not test node-postgres transport or its default bigint parser; comparisons of
aggregate values normalize the driver representation. They do not measure
performance or prove the absence of every possible API. Missing-helper claims
also require reviewing the published exports/declarations and official docs for
the pinned versions.

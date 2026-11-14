# Drizzle comparison checks

Reproduce the examples in `site/docs/comparisons/kysely-vs-drizzle.mdx` using
published Kysely 0.29.8, Drizzle 0.45.4, and Drizzle 1.0.0-rc.5. The runner
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

| Fixture                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable.mts`, `rc.mts`      | Unjoined selections, predicates, and underlying-table references after a subquery alias.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `operator-inputs.mts`       | Incompatible column expressions, non-boolean inputs, literal checks, and references inside SQL fragments, including `LIKE` with an `ESCAPE` clause, which the `like` of neither library takes.                                                                                                                                                                                                                                                                                                                                                       |
| `immutable.mts`             | Shared-builder mutation and fresh-builder workarounds through both Drizzle clients.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `json-traversal.mts`        | Matching JSON results, empty arrays, misspelled keys, invalid traversal, and exact Kysely output types.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `case-builder.mts`          | CASE results, null ages, omitted ELSE, inferred nullability, and invalid branch structure.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `relations-json.mts`        | SQL-style JSON aggregation, ordering, per-parent limits, empty arrays, explicit aliases, and the manual-wrapper alias mismatch.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `coverage-comparison.mts`   | Aggregate FILTER, window ranks with ties, and invalid partition references.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `built-in-alternatives.mts` | Drizzle relational queries with ordered/limited nested pets, both built-in single-count alternatives, and simultaneous FILTER aggregates.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `extensibility.mts`         | Join deduplication and Drizzle's published PostgreSQL proxy dialect factory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `query-tree.mts`            | A Kysely query read as operation nodes and rewritten by the exported transformer; a custom plugin making a derived instance read-only, refusing an insert, update, delete, merge, or template statement however it was composed, while a select that wraps a data-modifying CTE passes it and the exported transformer finds it; a Drizzle builder's clause config being protected, its statement yielding only text, name, column, and parameter chunks, and `and()` with no filters compiling to a delete with no WHERE.                           |
| `shared-queries.mts`        | Matching left-join rows and inferred types (also through 0.45's `Kyselify`), the 1.0 relational query beside `jsonArrayFrom`, a second `where()` rejected outside dynamic mode and replacing the first inside it, awaited async helpers, `withSchema`, and Kysely's ambiguous unqualified reference.                                                                                                                                                                                                                                                 |
| `join-shapes.mts`           | Drizzle's left-joined nested object typed and returned as `null` as a whole; Kysely's joined columns nullable one by one.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `dialect-types.mts`         | `returning()` compiling on a Kysely MySQL instance, and absent from Drizzle's MySQL insert builder in types and at runtime.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `removed-join.mts`          | A join removed while collected filters still read its table: compiling, running without the option, and failing with it in Drizzle; rejected by Kysely in the chain, in a helper typed with that table, and in a reference passed as an expression; accepted by a Kysely helper typed with a union of tables.                                                                                                                                                                                                                                        |
| `statement-scope.mts`       | Another table's column in ORDER BY, GROUP BY, HAVING, SET, and a delete's WHERE, a CTE that was never attached, and `returning()` resolving another table's column against the target table.                                                                                                                                                                                                                                                                                                                                                         |
| `kysely-gaps.mts`           | Kysely compiling `= null` and a union with reordered columns, where Drizzle rejects the first via types and throws on the second; and the references Kysely takes on trust: `sql.ref`, template text, a dynamic reference, and an expression from a standalone `expressionBuilder`.                                                                                                                                                                                                                                                                  |
| `inline-examples.mts`       | Every JSDoc example labeled `ts` in the published declarations parsed as TypeScript: all of Kysely's parse, Drizzle 0.45.4 has one `...` placeholder, and 1.0.0-rc.5's MSSQL `delete` and `insert` examples do not parse. That nothing in Drizzle's repository checks its examples is a reading of its scripts and CI workflows, not something this suite can pin.                                                                                                                                                                                   |
| `statement-flow.mts`        | A table alias, a derived table, and a CTE written inside one Kysely chain and declared as variables first in Drizzle, with matching rows, including the page's self-join; an inline Drizzle alias that its join condition cannot name; a select alias in WHERE or HAVING rejected by Kysely's types and by PostgreSQL, and compiled by Drizzle, which repeats the expression through the `where()` callback and otherwise sends the bare alias or an aggregate in WHERE; Drizzle's `inArray`, `ne`, and `isNull` emitting `IN`, `<>`, and `IS NULL`. |
| `cancellation.mts`          | Kysely's `execute()`, `stream()`, and `connection()` rejecting on an already-aborted signal and stopping to wait for a slow driver on a timed-out one; Drizzle's `execute()` typed to take placeholder values and its transaction options no signal, on 0.45.4 and 1.0.0-rc.5.                                                                                                                                                                                                                                                                       |
| `statement-coverage.mts`    | Recursive and materialized CTEs, `MERGE`, `DELETE ... USING`, a MySQL delete with a join, row-value `IN`, `NULLS LAST`, `IS DISTINCT FROM`, `ON CONFLICT ON CONSTRAINT`, `coalesce`, and a transaction controlled by calls, each run through Kysely on PostgreSQL, and `stream()` on the builder; the same statements absent from Drizzle 0.45.4 and 1.0.0-rc.5 as exports, builder members, and types, and its logger typed to receive the SQL text and parameters only.                                                                            |

## Bundle size

`bundle-size/` is a separate package, so Vite and `pg` stay out of the type
checks above. It bundles one PostgreSQL `select * from person` per library with
Vite 8.3.6 as a minified server build, leaving `pg` external, and asserts the
sizes quoted on the page:

```sh
cd bundle-size
npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund
npm test
```

With `COMPARISON_DATABASE_URL` set to a disposable PostgreSQL database, it also
runs the three bundles and checks that they return the same rows.

## Type-checking cost

`type-cost/` measures what each library asks of the compiler, as TypeScript's
instantiation count from `tsc --extendedDiagnostics`. It uses this package's
dependencies, plus Kysely 0.30.0-beta.2 as `kysely-next`:

```sh
npm run test:type-cost
```

`generate.mjs` writes one schema per library from one table shape, at 10, 100,
and 1,000 tables: a `Database` interface in the style a type generator emits for
Kysely, and `pgTable` objects for Drizzle. It writes the same ten queries for
each library (a lookup by id, all columns, a left join, two inner joins, GROUP BY
with HAVING, an IN subquery, a CTE, an insert, an update, and optional filters),
each assigned to the same written-out row type, and the same ten again over a
second set of tables. Neither side uses a `sql` template, and Drizzle's client
is created without a relations schema. Kysely 0.29.8 is measured twice: as
written, and with each query narrowed by `$pickTables` to the tables it reads,
which are the tables the Drizzle version of the query imports. `equivalence.mjs` runs all of them on
PGlite and requires the same rows from every library.

`measure.mjs` type-checks 195 programs per compiler and asserts the counts in
`expected.json` exactly (`--update` rewrites the file, `--time` also prints
check times):

- `baseline`: the library, a client, and the schema, with no query.
- `all`: the ten queries. Minus `baseline`, this includes the types each library
  instantiates once per program.
- `all-twice`: the ten, and the ten again over the other tables. Minus `all`,
  this is the cost of ten more queries.
- `all-plus-<query>`: the ten, and one query again. Minus `all`, this is the
  cost of one more query of that kind.

TypeScript 7 checks files on several checkers, each with its own cache, so its
default count repeats first-use work per checker and changes with how files are
split. The counts are taken with `--singleThreaded`, where TypeScript 7 agrees
with TypeScript 6 within 3%. Check time is measured in the default mode, depends
on the machine, and is printed, never asserted. Every program is checked with
`strict` and `skipLibCheck`.

PGlite tests PostgreSQL execution semantics without a server. These fixtures do
not test node-postgres transport or its default bigint parser; comparisons of
aggregate values normalize the driver representation. They do not measure
performance or prove the absence of every possible API. Missing-helper claims
also require reviewing the published exports/declarations and official docs for
the pinned versions.

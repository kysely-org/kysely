---
description: 'Configure Kysely query and error logging with built-in log levels or a custom callback for SQL, parameters, and execution duration.'
---

# Logging

It is possible to set up logs for all queries using the `log` property when instantiating `Kysely`.

There are 2 ways to configure logging:

## 1. Provide an array with log level/s

You can provide an array of log levels to the `log` property when instantiating `Kysely`.

When `'query'` is included in the array, `Kysely` will log all executed queries, not including parameter values.

When `'error'` is included in the array, `Kysely` will log all errors.

```ts
const db = new Kysely({
  ...
  log: ['query', 'error']
  ...
});
```

## 2. Provide a custom logging function

You can provide a custom logging function to the `log` property when instantiating `Kysely`. The custom logging function receives a log event as an argument.

`LogEvent` is a discriminated union. Query events may have `isStream`; only error
events have an `error` property:

```ts
type LogEvent =
  | {
      level: 'query'
      isStream?: boolean
      query: CompiledQuery
      queryDurationMillis: number
    }
  | {
      level: 'error'
      error: unknown
      query: CompiledQuery
      queryDurationMillis: number
    }
```

Example:

```ts
const db = new Kysely({
  dialect: new PostgresDialect(postgresConfig),
  log(event) {
    if (event.level === "error") {
        console.error("Query failed : ", {
          durationMs: event.queryDurationMillis,
          error: event.error,
          sql: event.query.sql,
          params: event.query.parameters.map(maskPII),
        });
    } else { // `'query'`
      console.log("Query executed : ", {
        durationMs: event.queryDurationMillis,
        sql: event.query.sql,
        params: event.query.parameters.map(maskPII),
      });
    }
  }
})
```

For more information check the docs for details on the interfaces [KyselyConfig](https://kysely-org.github.io/kysely-apidoc/interfaces/KyselyConfig.html).

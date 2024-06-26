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

The `LogEvent` interface is defined as follows:

```ts
interface LogEvent {
  level: 'query' | 'error';
  query: CompiledQuery; // this object contains the raw SQL string, parameters, and Kysely's SQL syntax tree that helped output the raw SQL string.
  queryDurationMillis: number; // the time in milliseconds it took for the query to execute and get a response from the database.
  error: unknown; // only present if `level` is `'error'`.
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

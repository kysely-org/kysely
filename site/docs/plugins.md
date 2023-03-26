# Plugin system

Plugins are classes that implement [KyselyPlugin](https://kysely-org.github.io/kysely/interfaces/KyselyPlugin.html). Plugins are then added to the `Kysely` instance as follows:

```ts
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    database: 'kysely_test',
    host: 'localhost',
  }),
  plugins: [new CamelCasePlugin()],
})
```

## Built-in plugins

### Camel case plugin

A plugin that converts snake_case identifiers in the database into camelCase in the JavaScript side. [Learn more](https://kysely-org.github.io/kysely/classes/CamelCasePlugin.html).

### Deduplicate joins plugin

Plugin that removes duplicate joins from queries. You can read more about it in the [examples](/docs/recipes/deduplicate-joins) section or check the [API docs](https://kysely-org.github.io/kysely/classes/DeduplicateJoinsPlugin.html).

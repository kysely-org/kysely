# Plugin system

Plugins are classes that implement [KyselyPlugin](https://kysely-org.github.io/kysely-apidoc/interfaces/KyselyPlugin.html). Plugins are then added to the `Kysely` instance as follows:

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

A plugin that converts snake_case identifiers in the database into camelCase in the JavaScript side. [Learn more](https://kysely-org.github.io/kysely-apidoc/classes/CamelCasePlugin.html).

### Deduplicate joins plugin

Plugin that removes duplicate joins from queries. You can read more about it in the [examples](/docs/recipes/deduplicate-joins) section or check the [API docs](https://kysely-org.github.io/kysely-apidoc/classes/DeduplicateJoinsPlugin.html).

### Safe empty where in plugin

A plugin that prevents empty arrays from breaking queries in the database. All empty arrays are substituted with a (null) value, which essentially translates to a no-op.
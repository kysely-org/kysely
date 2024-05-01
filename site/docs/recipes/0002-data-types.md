# Data types

When talking about data types in Kysely we need to make a distinction between the two kinds of types:

1. Typescript types
2. Runtime JavaScript types

## Typescript types

In Kysely, you only define TypeScript types for your tables and columns. Since TypeScript is entirely a compile-time concept, TypeScript types __can't__ affect runtime JavaScript types. If you define your column to be a `string` in TypeScript but the database returns a `number`, the runtime type doesn't magically change to `string`. You'll see a `string` in the TypeScript code, but observe a number when you run the program.

:::info
It's up to **you** to select correct TypeScript types for your columns based on what the driver returns.
:::

## Runtime JavaScript types

The database driver, such as `pg` or `mysql2`, decides the runtime JavaScript types the queries return. Kysely never touches the runtime types the driver returns. In fact, Kysely doesn't touch the data returned by the driver in any way. It simply executes the query and returns whatever the driver returns. An exception to this rule is when you use a plugin like `CamelCasePlugin`, in which case Kysely does change the column names.

You need to read the underlying driver's documentation or otherwise figure out what the driver returns and then align the TypeScript types to match them.

### Configuring runtime JavaScript types

Most drivers provide a way to change the returned types. For example `pg` returns `bigint` and `numeric` types as strings by default, but often you want to configure it to return numbers instead.

#### Postgres

When using the `pg` driver, you can use the [pg-types](https://github.com/brianc/node-pg-types) package to configure the types. For example here's how you'd configure the `bigint` to be returned as a number:

```ts
import { Kysely, PostgresDialect } from 'kysely'
import * as pg from 'pg'

const int8TypeId = 20
// Map int8 to number.
pg.types.setTypeParser(int8TypeId, (val) => {
  return parseInt(val, 10)
})

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool(config),
  }),
})
```

See the documentation [here](https://github.com/brianc/node-pg-types) on how to figure out the correct type id.

#### MySQL

When using the `mysql2` driver, you an use the [typeCast](https://github.com/mysqljs/mysql?tab=readme-ov-file#custom-type-casting) pool property.

For example here's how you'd map `tinyint(1)` to a boolean:

```ts
import { Kysely, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'

export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: createPool({
      ...config,
      // Map tinyint(1) to boolean
      typeCast(field, next) {
        if (field.type === 'TINY' && field.length === 1) {
          return field.string() === '1'
        } else {
          return next()
        }
      },
    }),
  }),
})
```

## Type generators

There are third-party type generators such as [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen) and [kanel-kysely](https://kristiandupont.github.io/kanel/kanel-kysely.html) that automatically generate TypeScript types based on the database schema. Find out more at ["Generating types"](https://kysely.dev/docs/generating-types).

If these tools generate a type that doesn't match the runtime type you observe, please refer to their documentation or open an issue in their github. Kysely has no control over these libraries.
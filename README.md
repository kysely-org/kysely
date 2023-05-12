[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://stand-with-ukraine.pp.ua)
[![Discord](https://img.shields.io/discord/890118421587578920?logo=discord&style=flat)](https://discord.gg/xyBJ3GwvAm)
[![Tests](https://github.com/koskimas/kysely/actions/workflows/test.yml/badge.svg)](https://github.com/koskimas/kysely)
[![License](https://img.shields.io/github/license/kysely-org/kysely?style=flat)](https://github.com/kysely-org/kysely/blob/master/LICENSE)
[![Issues](https://img.shields.io/github/issues-closed/kysely-org/kysely?logo=github)](https://github.com/kysely-org/kysely/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)
[![Pull Requests](https://img.shields.io/github/issues-pr-closed/kysely-org/kysely?label=PRs&logo=github&style=flat)](https://github.com/kysely-org/kysely/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/kysely-org/kysely?style=flat&logo=snyk)](https://snyk.io/advisor/npm-package/kysely)
[![Downloads](https://img.shields.io/npm/dw/kysely?logo=npm)]()
[![Social](https://img.shields.io/twitter/follow/kysely_?style=social)](https://twitter.com/kysely_)

# [Kysely](https://kysely-org.github.io/kysely/index.html)

Kysely (pronounce “Key-Seh-Lee”) is a type-safe and autocompletion-friendly typescript SQL query builder. Inspired by
[knex](http://knexjs.org/). Mainly developed for [node.js](https://nodejs.org/en/) but also runs on [deno](https://deno.land/)
and in the browser.

![](https://github.com/koskimas/kysely/blob/master/assets/demo.gif)

Kysely makes sure you only refer to tables and columns that are visible to the part of the query
you're writing. The result type only has the selected columns with correct types and aliases. As an
added bonus you get autocompletion for all that stuff.

As shown in the gif above, through the pure magic of modern typescript, Kysely is even able to parse
the alias given to `pet.name` and add the `pet_name` column to the result row type. Kysely is able to infer
column names, aliases and types from selected subqueries, joined subqueries, `with` statements and pretty
much anything you can think of.

Of course there are cases where things cannot be typed at compile time, and Kysely offers escape
hatches for these situations. See the [sql template tag](https://kysely-org.github.io/kysely/interfaces/Sql.html) 
and the [DynamicModule](https://kysely-org.github.io/kysely/classes/DynamicModule.html#ref) for more info.

All API documentation is written in the typing files and you can simply `cmd-click` on the module, class
or method you're using to see it. The same documentation is also hosted [here](https://github.com/koskimas/kysely).

If you start using Kysely and can't find something you'd want to use, please open an issue or join our
[discord server](https://discord.gg/xyBJ3GwvAm).

You can find a more thorough introduction [here](https://www.jakso.me/blog/kysely-a-type-safe-sql-query-builder-for-typescript).

# Table of contents

- [Installation](#installation)
    - [3rd party dialects](#3rd-party-dialects)
- [Minimal example](#minimal-example)
- [Playground](#playground)
- [Generating types](#generating-types)
- [Query examples](#query-examples)
  - [Select queries](#select-queries)
    - [Stream select query results](#stream-select-query-results)
  - [Update queries](#update-queries)
  - [Insert queries](#insert-queries)
  - [Delete queries](#delete-queries)
- [Recipes](#recipes)
- [Migrations](#migrations)
    - [PostgreSQL migration example](#postgresql-migration-example)
    - [MySQL migration example](#mysql-migration-example)
- [Deno](#deno)
- [Browser](#browser)
- [Why not just contribute to knex](#why-not-just-contribute-to-knex)

# Installation

Kysely currently works on PostgreSQL, MySQL and SQLite. You can install it using:

```
# PostgreSQL
npm install kysely pg

# MySQL
npm install kysely mysql2

# SQLite
npm install kysely better-sqlite3
```

More dialects will be added soon. Kysely also has a simple interface
for [3rd party dialects](https://kysely-org.github.io/kysely/interfaces/Dialect.html).

### 3rd party dialects

 - [PlanetScale Serverless Driver](https://github.com/depot/kysely-planetscale)
 - [Cloudflare D1](https://github.com/aidenwallis/kysely-d1)
 - [AWS RDS Data API](https://github.com/serverless-stack/kysely-data-api)
 - [SurrealDB](https://github.com/igalklebanov/kysely-surrealdb)
 - [Neon](https://github.com/seveibar/kysely-neon)
 - [AWS S3 Select](https://github.com/igalklebanov/kysely-s3-select)
 - [libSQL/sqld](https://github.com/libsql/kysely-libsql)
 - [SingleStore Data API](https://github.com/igalklebanov/kysely-singlestore)
 - [Postgres.js](https://github.com/igalklebanov/kysely-postgres-js)
 - [Fetch driver](https://github.com/andersgee/kysely-fetch-driver)

# Minimal example

All you need to do is define an interface for each table in the database and pass those
interfaces to the `Kysely` constructor:

```ts
import { Pool } from 'pg'
import {
  Kysely,
  PostgresDialect,
  Generated,
  ColumnType,
  Selectable,
  Insertable,
  Updateable,
} from 'kysely'

interface PersonTable {
  // Columns that are generated by the database should be marked
  // using the `Generated` type. This way they are automatically
  // made optional in inserts and updates.
  id: Generated<number>

  first_name: string
  gender: 'male' | 'female' | 'other'

  // If the column is nullable in the database, make its type nullable.
  // Don't use optional properties. Optionality is always determined
  // automatically by Kysely.
  last_name: string | null

  // You can specify a different type for each operation (select, insert and
  // update) using the `ColumnType<SelectType, InsertType, UpdateType>`
  // wrapper. Here we define a column `modified_at` that is selected as
  // a `Date`, can optionally be provided as a `string` in inserts and
  // can never be updated:
  modified_at: ColumnType<Date, string | undefined, never>
}

interface PetTable {
  id: Generated<number>
  name: string
  owner_id: number
  species: 'dog' | 'cat'
}

interface MovieTable {
  id: Generated<string>
  stars: number
}

// Keys of this interface are table names.
interface Database {
  person: PersonTable
  pet: PetTable
  movie: MovieTable
}

// You'd create one of these when you start your app.
const db = new Kysely<Database>({
  // Use MysqlDialect for MySQL and SqliteDialect for SQLite.
  dialect: new PostgresDialect({
    pool: new Pool({
      host: 'localhost',
      database: 'kysely_test'
    })
  })
})

async function demo() {
  const { id } = await db
    .insertInto('person')
    .values({ first_name: 'Jennifer', gender: 'female' })
    .returning('id')
    .executeTakeFirstOrThrow()

  await db
    .insertInto('pet')
    .values({ name: 'Catto', species: 'cat', owner_id: id })
    .execute()

  const person = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select(['first_name', 'pet.name as pet_name'])
    .where('person.id', '=', id)
    .executeTakeFirst()

  if (person) {
    person.pet_name
  }
}
```

```ts
// You can extract the select, insert and update interfaces like this
// if you want (you don't need to):
type Person = Selectable<PersonTable>
type InsertablePerson = Insertable<PersonTable>
type UpdateablePerson = Updateable<PersonTable>
```

# Playground

[@wirekang](https://github.com/wirekang) has created a [playground for Kysely](https://kyse.link). You can use to quickly test stuff out and for creating code examples for your issues, PRs and discord messages.

# Generating types

To work with Kysely, you're required to provide a database schema type definition to the Kysely constructor.

In many cases, defining your database schema definitions manually is good enough.

However, when building production applications, its best to stay aligned with the 
database schema, by automatically generating the database schema type definitions.

There are several ways to do this using 3rd party libraries:

- [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen) - This library 
generates Kysely database schema type definitions by connecting to and introspecting 
your database. This library works with all built-in dialects.

- [prisma-kysely](https://github.com/valtyr/prisma-kysely) - This library generates 
Kysely database schema type definitions from your existing Prisma schemas.

# Query examples

## Select queries

You can find examples of select queries in the documentation of the 
[select method](https://kysely-org.github.io/kysely/classes/SelectQueryBuilder.html#select) and
the [where method](https://kysely-org.github.io/kysely/classes/SelectQueryBuilder.html#where)
among other places.

### Stream select query results

*Currently only supported by `postgres` and `mysql` dialects.*

```ts
import { Pool } from 'pg'
// or `import * as Cursor from 'pg-cursor'` depending on your tsconfig
import Cursor from 'pg-cursor'
import { Kysely, PostgresDialect } from 'kysely'

const db = new Kysely<Database>({
  // PostgresDialect requires the Cursor dependency
  dialect: new PostgresDialect({
    pool: new Pool({
      host: 'localhost',
      database: 'kysely_test'
    }),
    cursor: Cursor
  }),
  // MysqlDialect doesn't require any special configuration
})

async function demo() {
  for await (const adult of db.selectFrom('person')
    .selectAll()
    .where('age', '>', 18)
    .stream()
  ) {
    console.log(`Hello ${adult.first_name}!`)

    if (adult.first_name === 'John') {
      // After this line the db connection is released and no more
      // rows are streamed from the database to the client
      break;
    }
  }
}
```

## Update queries

See the [set method](https://kysely-org.github.io/kysely/classes/UpdateQueryBuilder.html#set) and the
[updateTable method](https://kysely-org.github.io/kysely/classes/Kysely.html#updateTable)
documentation.

## Insert queries

See the [values method](https://kysely-org.github.io/kysely/classes/InsertQueryBuilder.html#values) and the
[insertInto method](https://kysely-org.github.io/kysely/classes/Kysely.html#insertInto)
documentation.

## Delete queries

See the [deleteFrom method](https://kysely-org.github.io/kysely/classes/Kysely.html#deleteFrom)
documentation.

# Recipes

The [recipes](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/) folder contains a bunch of small tutorials
or "recipes" for common use cases.

* [Expressions](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/expressions.md)
* [Conditional selects](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/conditional-selects.md)
* [Dealing with the `Type instantiation is excessively deep and possibly infinite` error](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/excessively-deep-types.md)
* [Deduplicate joins](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/deduplicate-joins.md)
* [Extending kysely](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/extending-kysely.md)
* [Introspecting relation metadata](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/introspecting-relation-metadata.md)
* [Raw SQL](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/raw-sql.md)
* [Relations](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/relations.md)
* [Schemas](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/schemas.md)
* [Splitting build, compile and execute code](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/splitting-build-compile-and-execute-code.md)

# Migrations

Migration files should look like this:

```ts
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Migration code
}

export async function down(db: Kysely<any>): Promise<void> {
  // Migration code
}
```

The `up` function is called when you update your database schema to the next version and `down`
when you go back to previous version. The only argument for the functions is an instance of
`Kysely<any>`. It's important to use `Kysely<any>` and not `Kysely<YourDatabase>`. 

Migrations should never depend on the current code of your app because they need to work even when the app
changes. Migrations need to be "frozen in time".

The migrations can use the [Kysely.schema](https://kysely-org.github.io/kysely/classes/SchemaModule.html)
module to modify the schema. Migrations can also run normal queries to modify data.

Execution order of the migrations is the alpabetical order of their names. An excellent way to name your
migrations is to prefix them with an ISO 8601 date string. A date prefix works well in large teams
where multiple team members may add migrations at the same time in parallel commits without knowing
about the other migrations.

You don't need to store your migrations as separate files if you don't want to. You can easily
implement your own [MigrationProvider](https://kysely-org.github.io/kysely/interfaces/MigrationProvider.html)
and give it to the [Migrator](https://kysely-org.github.io/kysely/classes/Migrator.html) class
when you instantiate one.

### PostgreSQL migration example

```ts
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('person')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar', (col) => col.notNull())
    .addColumn('last_name', 'varchar')
    .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute()

  await db.schema
    .createTable('pet')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull().unique())
    .addColumn('owner_id', 'integer', (col) =>
      col.references('person.id').onDelete('cascade').notNull()
    )
    .addColumn('species', 'varchar', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('pet_owner_id_index')
    .on('pet')
    .column('owner_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pet').execute()
  await db.schema.dropTable('person').execute()
}
```

### MySQL migration example

```ts
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('person')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('first_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('pet')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('owner_id', 'integer', (col) => col.notNull())
    .addColumn('species', 'varchar(255)', (col) => col.notNull())
    .addForeignKeyConstraint(
      'pet_owner_id_fk', ['owner_id'], 'person', ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute()

  await db.schema
    .createIndex('pet_owner_id_index')
    .on('pet')
    .column('owner_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pet').execute()
  await db.schema.dropTable('person').execute()
}
```

You can then use

```ts
const migrator = new Migrator(migratorConfig);
await migrator.migrateToLatest(pathToMigrationsFolder)
```

to run all migrations that have not yet been run. See the
[Migrator](https://kysely-org.github.io/kysely/classes/Migrator.html)
class's documentation for more info.

Kysely doesn't have a CLI for running migrations and probably never will. This is because Kysely's
migrations are also written in typescript. To run the migrations, you need to first build the
typescript code into javascript. A CLI would cause confusion over which migrations are being
run, the typescript ones or the javascript ones. If we added support for both, the CLI would 
need to depend on a typescript compiler, which most production environments don't (and shouldn't)
have. You will probably want to add a simple migration script to your projects like this:

```ts
import * as path from 'path'
import { Pool } from 'pg'
import { promises as fs } from 'fs'
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider
} from 'kysely'

async function migrateToLatest() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: 'localhost',
        database: 'kysely_test',
      })
    }),
  })

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: 'some/path/to/migrations',
    })
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
```

The migration methods use a lock on the database level and parallel calls are executed serially.
This means that you can safely call `migrateToLatest` and other migration methods from multiple
server instances simultaneously and the migrations are guaranteed to only be executed once. The
locks are also automatically released if the migration process crashes or the connection to the
database fails.

# Deno

Kysely doesn't include drivers for deno, but you can still use Kysely as a query builder
or implement your own driver:

```ts
// We use jsdeliver to get Kysely from npm.
import {
  DummyDriver,
  Generated,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'https://cdn.jsdelivr.net/npm/kysely/dist/esm/index.js'

interface Person {
  id: Generated<number>
  first_name: string
  last_name: string | null
}

interface Database {
  person: Person
}

const db = new Kysely<Database>({
  dialect: {
    createAdapter() {
      return new PostgresAdapter()
    },
    createDriver() {
      // You need a driver to be able to execute queries. In this example
      // we use the dummy driver that never does anything.
      return new DummyDriver()
    },
    createIntrospector(db: Kysely<unknown>) {
      return new PostgresIntrospector(db)
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler()
    },
  },
})

const query = db.selectFrom('person').select('id')
const sql = query.compile()

console.log(sql.sql)
```

# Browser

Kysely also runs in the browser:

```ts
import {
  Kysely,
  Generated,
  DummyDriver,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely'

interface Person {
  id: Generated<number>
  first_name: string
  last_name: string | null
}

interface Database {
  person: Person
}

const db = new Kysely<Database>({
  dialect: {
    createAdapter() {
      return new SqliteAdapter()
    },
    createDriver() {
      return new DummyDriver()
    },
    createIntrospector(db: Kysely<unknown>) {
      return new SqliteIntrospector(db)
    },
    createQueryCompiler() {
      return new SqliteQueryCompiler()
    },
  },
})

window.addEventListener('load', () => {
  const sql = db.selectFrom('person').select('id').compile()

  const result = document.createElement('span')
  result.id = 'result'
  result.innerHTML = sql.sql

  document.body.appendChild(result)
})
```

# Why not just contribute to knex

Kysely is very similar to knex, but it also attempts to fix things that I personally find not-so-good
in knex. Bringing the type system and the changes to knex would mean very significant breaking changes
that aren't possible at this point of the project. Knex was also originally written for javascript and
the typescript typings were added afterwards. That always leads to compromises in the types. Designing
a library for typescript from the ground up produces much better and simpler types.

# Contributors

<p align="center">
    <a href="https://github.com/kysely-org/kysely/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=kysely-org/kysely" />
    </a>
    </br>
    <span>Want to contribute? Check out our <a href="./CONTRIBUTING.md" >contribution guidelines</a>.</span>
</p>

<p align="center">
    <a href="https://vercel.com/?utm_source=kysely&utm_campaign=oss">
        <img src="https://kysely.dev/img/powered-by-vercel.svg" alt="Powered by Vercel" />
    </a>
</p>

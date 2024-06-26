# Extending kysely

In many cases, Kysely doesn't provide a built-in type-safe method for a feature. It's often because adding
that feature in a generic way that would work in all use cases is difficult or impossible.
In many cases it's better to create little helper functions in your project that suit your use case.
Kysely makes this simple.

The Kysely API is designed around two interfaces [`Expression<T>`](https://kysely-org.github.io/kysely-apidoc/interfaces/Expression.html)
and [`AliasedExpression<T, A>`](https://kysely-org.github.io/kysely-apidoc/interfaces/AliasedExpression.html).
Almost every method accepts values that implement these interfaces and most Kysely internals achieve
their "type magic" by implementing them.

Most of the time you can create your helpers using the [sql template tag](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html)
and the `RawBuilder<T>` and `AliasedRawBuilder<T, A>` class instances it returns, but it's good to first understand how
the underlying interfaces they implement, `Expression<T>` and `AliasedExpression<T, A>`, work.

## Expression

[`Expression<T>`](https://kysely-org.github.io/kysely-apidoc/interfaces/Expression.html) is a simple interface
that has a type `T` and a single method `toOperationNode()`. `T` tells Kysely's type system the type of
the expression. `toOperationNode()` returns instructions on what SQL should be produced once the
expression is compiled.

Here's an example of a custom expression for `JSON` or `JSONB` values on PostgreSQL:

```ts
import { Expression, Kysely, OperationNode, sql } from 'kysely'

class JsonValue<T> implements Expression<T> {
  #value: T

  constructor(value: T) {
    this.#value = value
  }

  // This is a mandatory getter. You must add it and always return `undefined`.
  // The return type must always be `T | undefined`.
  get expressionType(): T | undefined {
    return undefined
  }

  toOperationNode(): OperationNode {
    const json = JSON.stringify(this.#value)
    // Most of the time you can use the `sql` template tag to build the returned node.
    // The `sql` template tag takes care of passing the `json` string as a parameter, alongside the sql string, to the DB.
    return sql`CAST(${json} AS JSONB)`.toOperationNode()
  }
}
```

Now you can use your new `JsonValue` expression pretty much anywhere _as a value_ in a type-safe way:

```ts
interface DB {
  person: {
    address: {
      postalCode: string
      street: string
    }
  }
}

async function test(db: Kysely<DB>) {
  await db
    .insertInto('person')
    .values({
      address: new JsonValue({
        postalCode: '123456',
        street: 'Kysely avenue 42',
      }),
    })
    .execute()

  await db
    .selectFrom('person')
    .selectAll()
    .where(
      'address',
      '@>',
      new JsonValue({ postalCode: '123456', street: 'Kysely avenue 42' })
    )
    .execute()
}
```

Most of the time you don't need to create your own classes that implement the `Expression<T>` interface.
You can simply wrap the [sql template tag](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html) and
the `RawBuilder<T>` class instance it returns in a function. `RawBuilder<T>`, like most things in Kysely,
implements the `Expression<T>` interface.

Our previous example would get simplified into this:

```ts
import { Kysely, RawBuilder, sql } from 'kysely'

function json<T>(value: T): RawBuilder<T> {
  return sql`CAST(${JSON.stringify(value)} AS JSONB)`
}
```

And you'd use it like this:

```ts
interface DB {
  person: {
    address: {
      postalCode: string
      street: string
    }
  }
}

async function test(db: Kysely<DB>) {
  await db
    .insertInto('person')
    .values({
      address: json({
        postalCode: '123456',
        street: 'Kysely avenue 42',
      }),
    })
    .execute()

  await db
    .selectFrom('person')
    .selectAll()
    .where(
      'address',
      '@>',
      json({ postalCode: '123456', street: 'Kysely avenue 42' })
    )
    .execute()
}
```

## AliasedExpression

While `Expression<T>` holds the type and compilation instructions of an SQL expression,
[`AliasedExpression<T, A>`](https://kysely-org.github.io/kysely-apidoc/interfaces/AliasedExpression.html)
also holds an alias (a name) for that expression. `AliasedExpression<T, A>` can be used in places
where you need a name for the expression, like in a `SELECT` statement or a `FROM` statement.
`AliasedExpression<T, A>` is how kysely is able to infer the name and type of result columns.

Let's expand the `JsonValue` example from the [previous section](#expression). We'll add an `as`
method for the `JsonValue` class that can be used to turn an `Expression<T>` into an `AliasedExpression<T, A>`:

```ts
import {
  Expression,
  AliasedExpression,
  Kysely,
  OperationNode,
  sql,
  AliasNode,
  IdentifierNode,
} from 'kysely'

class JsonValue<T> implements Expression<T> {
  // ... Methods from the previous example ...

  as<A extends string>(alias: A): AliasedJsonValue<T, A> {
    return new AliasedJsonValue(this, alias)
  }
}

class AliasedJsonValue<T, A extends string> implements AliasedExpression<T, A> {
  #expression: Expression<T>
  #alias: A

  constructor(expression: Expression<T>, alias: A) {
    this.#expression = expression
    this.#alias = alias
  }

  get expression(): Expression<T> {
    return this.#expression
  }

  get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#expression.toOperationNode(),
      IdentifierNode.create(this.#alias)
    )
  }
}
```

And now you can use `JsonValue` in `select` statements too with full type safety:

```ts
interface DB {
  person: {
    address: {
      postalCode: string
      street: string
    }
  }
}

async function test(db: Kysely<DB>) {
  const result = await db
    .selectFrom('person')
    .select([new JsonValue({ someValue: 42 }).as('some_object'), 'address'])
    .where(
      'address',
      '@>',
      new JsonValue({ postalCode: '123456', street: 'Kysely avenue 42' })
    )
    .executeTakeFirstOrThrow()

  console.log(result.some_object.someValue)
  console.log(result.address.postalCode)
}
```

Again, in most cases you don't need to implement your own `AliasedExpression<T, A>`.
`RawBuilder` has a similar `as` method and we can use the three line long `json`
function from our previous example:

```ts
function json<T>(value: T): RawBuilder<T> {
  return sql`CAST(${JSON.stringify(value)} AS JSONB)`
}
```

```ts
interface DB {
  person: {
    address: {
      postalCode: string
      street: string
    }
  }
}

async function test(db: Kysely<DB>) {
  const result = await db
    .selectFrom('person')
    .select([json({ someValue: 42 }).as('some_object'), 'address'])
    .where(
      'address',
      '@>',
      json({ postalCode: '123456', street: 'Kysely avenue 42' })
    )
    .executeTakeFirstOrThrow()

  console.log(result.address.postalCode)
  console.log(result.some_object.someValue)
}
```

## A more complex example

Consider this query:

```sql
insert into
  t (t1, t2)
select
  v.v1,
  j.j2
from
  (values ($1, $2, $3), ($4, $5, $6)) as v(id, v1, v2)
inner join
  j on v.id = j.vid
```

Kysely doesn't have built-in support for the `values` keyword in this context, but you can create
a type-safe helper function like this:

```ts
function values<R extends Record<string, unknown>, A extends string>(
  records: R[],
  alias: A
): AliasedRawBuilder<R, A> {
  // Assume there's at least one record and all records
  // have the same keys.
  const keys = Object.keys(records[0])

  // Transform the records into a list of lists such as
  // ($1, $2, $3), ($4, $5, $6)
  const values = sql.join(
    records.map((r) => sql`(${sql.join(keys.map((k) => r[k]))})`)
  )

  // Create the alias `v(id, v1, v2)` that specifies the table alias
  // AND a name for each column.
  const wrappedAlias = sql.ref(alias)
  const wrappedColumns = sql.join(keys.map(sql.ref))
  const aliasSql = sql`${wrappedAlias}(${wrappedColumns})`

  // Finally create a single `AliasedRawBuilder` instance of the
  // whole thing. Note that we need to explicitly specify
  // the alias type using `.as<A>` because we are using a
  // raw sql snippet as the alias.
  return sql<R>`(values ${values})`.as<A>(aliasSql)
}
```

A lot is going on in this function, but it's all documented in the
[sql template tag's documentation.](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html)

Most of the time a helper like this would return either an instance of `RawBuilder` or
`AliasedRawBuilder` and you'd create an instance using the `sql` template tag. You'd return a
`RawBuilder` instance when only the data type of a column/table is needed and an `AliasedRawBuilder`
when also the name of the column/table is needed. Our example function creates kind of a temporary
table, so we need to tell Kysely both the type of the table AND the name of the table.

This is how you could now create our query using the `values` helper:

```ts
// This could come as an input from somewhere.
const records = [
  {
    id: 1,
    v1: 'foo',
    v2: 'bar',
  },
  {
    id: 2,
    v1: 'baz',
    v2: 'spam',
  },
]

db.insertInto('t')
  .columns(['t1', 't2'])
  .expression(
    // The `values` function automatically parses the column types
    // from the records and you can refer to them through the table
    // alias `v`. This works because Kysely is able to parse the
    // AliasedRawBuilder<T, A> type.
    db
      .selectFrom(values(records, 'v'))
      .innerJoin('j', 'v.id', 'j.vid')
      .select(['v.v1', 'j.j2'])
  )
```

## Extending using inheritance

You usually don't want to do this because of the complexity of the types and TypeScript's limitations
when it comes to inheritence and return types.
You'll quickly run into problems.
Even though Kysely uses classes, it is not designed from the OOP point of view.
Classes are used because they are supported natively by TypeScript. They provide private
variables and a nice discoverable API.

## Extending using module augmentation

> DISCLAIMER: We do not support this method. Use at your own risk.

You can override and extend Kysely's builder classes via [Typescript module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation).

The following example adds an `addIdColumn` method to `CreateTableBuilder`, which helps
in adding a PostgreSQL UUID primary key column:

```ts
declare module 'kysely/dist/cjs/schema/create-table-builder' {
  interface CreateTableBuilder<TB extends string, C extends string = never> {
    addIdColumn<CN extends string = 'id'>(
      col?: CN
    ): CreateTableBuilder<TB, C | CN>
  }
}
CreateTableBuilder.prototype.addIdColumn = function (
  this: CreateTableBuilder<any, any>,
  col?: string
) {
  return this.addColumn(col || 'id', 'uuid', (col) =>
    col.primaryKey().defaultTo(sql`gen_random_uuid()`)
  )
}
```

Now you can use `addIdColumn` seamlessly to create several tables with a uniform
primary key definition:

```ts
db.schema.createTable('person').addIdColumn().addColumn('name', 'varchar')
db.schema.createTable('pet').addColumn('species', 'varchar').addIdColumn()
```

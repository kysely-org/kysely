# Reusable helpers

:::info
[Here's](https://kyse.link/qm67s) a playground link containing all the code in this recipe.
:::

Let's say you want to write the following query:

```sql
SELECT id, first_name
FROM person
WHERE upper(last_name) = $1
```

Kysely doesn't have a built-in `upper` function but there are at least three ways you could write this:

```ts
const lastName = 'STALLONE'

const persons = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  // 1. `sql` template tag. This is the least type-safe option.
  // You're providing the column name without any type-checking,
  // and plugins won't affect it.
  .where(
    sql<string>`upper(last_name)`, '=', lastName
  )
  // 2. `sql` template tag with `ref`. Anything passed to `ref`
  // gets type-checked against the accumulated query context.
  .where(({ eb, ref }) => eb(
    sql<string>`upper(${ref('last_name')})`, '=', lastName
  ))
  // 3. The `fn` function helps you avoid missing parentheses/commas
  // errors and uses refs as 1st class arguments.
  .where(({ eb, fn }) => eb(
    fn<string>('upper', ['last_name']), '=', lastName
  ))
  .execute()
```

but each option could be more readable or type-safe.

Fortunately Kysely allows you to easily create composable, reusable and type-safe helper functions:

```ts
import { Expression, sql } from 'kysely'

function upper(expr: Expression<string>) {
  return sql<string>`upper(${expr})`
}

function lower(expr: Expression<string>) {
  return sql<string>`lower(${expr})`
}

function concat(...exprs: Expression<string>[]) {
  return sql.join<string>(exprs, sql`||`)
}
```

Using the `upper` helper, our query would look like this:

```ts
const lastName = 'STALLONE'

const persons = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  .where(({ eb, ref }) => eb(
    upper(ref('last_name')), '=', lastName
  ))
  .execute()
```

The recipe for helper functions is simple: take inputs as `Expression<T>` instances where `T` is the type of the expression. For example `upper` takes in any `string` expression since it transforms strings to upper case. If you implemented the `round` function, it'd take in `Expression<number>` since you can only round numbers.

The helper functions should then use the inputs to create an output that's also an `Expression`. Everything you can create using the expression builder is an instance of `Expression`. So is the output of the `sql` template tag and all methods under the `sql` object. Same goes for `SelectQueryBuilder` and pretty much everything else in Kysely. Everything's an expression.

See [this recipe](https://kysely.dev/docs/recipes/expressions) to learn more about expressions.

So we've learned that everything's an expression and that expressions are composable. Let's put this idea to use:

```ts
const persons = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  .where(({ eb, ref, val }) => eb(
    concat(
      lower(ref('first_name')),
      val(' '),
      upper(ref('last_name'))
    ),
    '=',
    'sylvester STALLONE'
  ))
  .execute()
```

So far we've only used our helper functions in the first argument of `where` but you can use them anywhere:

```ts
const persons = await db
  .selectFrom('person')
  .innerJoin('pet', (join) => join.on(eb => eb(
    'person.first_name', '=', lower(eb.ref('pet.name'))
  )))
  .select(({ ref, val }) => [
    'first_name',
    // If you use a helper in `select`, you need to always provide an explicit
    // name for it using the `as` method.
    concat(ref('person.first_name'), val(' '), ref('pet.name')).as('name_with_pet')
  ])
  .orderBy(({ ref }) => lower(ref('first_name')))
  .execute()
```

## Reusable helpers using `ExpressionBuilder`

Here's an example of a helper function that uses the expression builder instead of raw SQL:

```ts
import { Expression, expressionBuilder } from 'kysely'

function idsOfPersonsThatHaveDogNamed(name: Expression<string>) {
  const eb = expressionBuilder<DB>()

  // A subquery that returns the identifiers of all persons
  // that have a dog named `name`.
  return eb
    .selectFrom('pet')
    .select('pet.owner_id')
    .where('pet.species', '=', 'dog')
    .where('pet.name', '=', name)
}
```

And here's how you could use it:

```ts
const dogName = 'Doggo'

const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .where((eb) => eb(
    'person.id', 'in', idsOfPersonsThatHaveDogNamed(eb.val(dogName))
  ))
  .execute()
```

Note that `idsOfPersonsThatHaveDogNamed` doesn't execute a separate query but instead returns a subquery expression that's compiled as a part of the parent query:

```sql
select
  person.*
from
  person
where
  person.id in (
    select pet.owner_id
    from pet
    where pet.species = 'dog'
    and pet.name = ?
  )
```

In all our examples we've used the following syntax:

```ts
.where(eb => eb(left, operator, right))
```

When the expression builder `eb` is used as a function, it creates a binary expression. All binary expressions with a comparison operator are represented as a `Expression<SqlBool>`. You don't always need to return `eb(left, operator, right)` from the callback though. Since `Expressions` are composable and reusable, you can return any `Expression<SqlBool>`.

This means you can create helpers like this:

```ts
function isOlderThan(age: Expression<number>) {
  return sql<SqlBool>`age > ${age}`
}
```

```ts
const persons = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  .where(({ val }) => isOlderThan(val(60)))
  .execute()
```

## Dealing with nullable expressions

If you want your helpers to work with nullable expressions (nullable columns etc.), you can do something like this:

```ts
import { Expression } from 'kysely'

// This function accepts both nullable and non-nullable string expressions.
function toInt<T extends string | null>(expr: Expression<T>) {
  // This returns `Expression<number | null>` if `expr` is nullable
  // and `Expression<number>` otherwise.
  return sql<T extends null ? (number | null) : number>`(${expr})::integer`
}
```

## Passing select queries as expressions

Let's say we have the following query:

```ts
const expr: Expression<{ name: string }> = db
  .selectFrom('pet')
  .select('pet.name')
```

The expression type of our query is `Expression<{ name: string }>` but SQL allows you to use a query like that as an `Expression<string>`. In other words, SQL allows you to use single-column record types like scalars. Most of the time Kysely is able to automatically handle this case but with helper functions you need to use `$asScalar()` to convert the type. Here's an example:

```ts
const persons = await db
  .selectFrom('person')
  .select((eb) => [
    'id',
    'first_name',
    upper(
      eb.selectFrom('pet')
        .select('name')
        .whereRef('person.id', '=', 'pet.owner_id')
        .limit(1)
        .$asScalar() // <-- This is needed
        .$notNull()
    ).as('pet_name')
  ])
```

The subquery is an `Expression<{ name: string }>` but our `upper` function only accepts `Expression<string>`. That's why we need to call `$asScalar()`. `$asScalar()` has no effect on the generated SQL. It's simply a type-level helper.

We also used `$notNull()` in the example because our simple `upper` function doesn't support nullable expressions.
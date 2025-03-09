# Expressions

An [`Expression<T>`](https://kysely-org.github.io/kysely-apidoc/interfaces/Expression.html) is the basic type-safe query building block in Kysely. Pretty much all methods accept expressions as inputs. Most internal classes like [SelectQueryBuilder](https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html) and [RawBuilder](https://kysely-org.github.io/kysely-apidoc/interfaces/RawBuilder.html) (the return value of the [sql tag](https://kysely-org.github.io/kysely-apidoc/functions/sql-1.html)) are expressions themselves.

`Expression<T>` represents an arbitrary SQL expression, like a binary expression (e.g. `a + b`), or a function call (e.g. `concat(arg1, ' ', arg2, ...)`). It can be any combination of those, no matter how complex. `T` is the output type of the expression.

## Expression builder

Expressions are usually built using an instance of [`ExpressionBuilder<DB, TB>`](https://kysely-org.github.io/kysely-apidoc/interfaces/ExpressionBuilder.html). `DB` is the same database type you give to `Kysely` when you create an instance. `TB` is the union of all table names that are visible in the context. For example `ExpressionBuilder<DB, 'person' | 'pet'>` means you can reference `person` and `pet` columns in the created expressions.

You can get an instance of the expression builder using a callback:

```ts
const person = await db
  .selectFrom('person')
  // `eb` is an instance of ExpressionBuilder<DB, 'person'>
  .select((eb) => [
    // Call the `upper` function on `first_name`. There's a bunch of
    // shortcuts to functions under the `fn` object such as
    // `eb.fn.coalesce()` that provide a cleaner syntax.
    eb.fn('upper', ['first_name']).as('upper_first_name'),

    // Select a subquery
    eb.selectFrom('pet')
      .select('name')
      .whereRef('pet.owner_id', '=', 'person.id')
      .limit(1)
      .as('pet_name'),

    // Select a boolean expression
    eb('first_name', '=', 'Jennifer').as('is_jennifer'),

    // Select a static string value
    eb.val('Some value').as('string_value'),

    // Select a literal value
    eb.lit(42).as('literal_value'),
  ])
  // You can also destructure the expression builder like this
  .where(({ and, or, eb, not, exists, selectFrom }) => or([
    and([
      eb('first_name', '=', firstName),
      eb('last_name', '=', lastName)
    ]),
    not(exists(
      selectFrom('pet')
        .select('pet.id')
        .whereRef('pet.owner_id', '=', 'person.id')
        .where('pet.species', 'in', ['dog', 'cat'])
    ))
  ]))
  .executeTakeFirstOrThrow()

console.log(person.upper_first_name)
console.log(person.pet_name)
console.log(person.is_jennifer)
```

The generated SQL:

```sql
select
  upper("first_name") as "upper_first_name",

  (
    select "name"
    from "pet"
    where "pet"."owner_id" = "person"."id"
    limit 1
  ) as "pet_name",

  "first_name" = $1 as "is_jennifer",
  $2 as "string_value",
  42 as "literal_value"
from
  "person"
where (
  (
    "first_name" = $3
    and "last_name" = $4
  )
  or not exists (
    select "pet.id"
    from "pet"
    where "pet"."owner_id" = "person"."id"
    and "pet"."species" in ($5, $6)
  )
)
```

In the above query we used the expression builder in `select` and `where` methods. You can use it the same way in other methods like `having`, `on`, `orderBy`, `groupBy` etc.

All expressions are composable. You can pass expressions as arguments of any expression. All query builder methods in Kysely accept expressions and expression builder callbacks. All expression builder methods offer auto-completions and type-safety just like methods on the query builders.

You might be wondering, "why do I need to use a callback to get the expression builder?". "Why not just create an instance using a global function?". The reason is that when you use a callback, Kysely is able to infer the context correctly. The expression builder's methods only auto-complete and accept column and table names that are available in the context. In other words, using a callback provides more type-safety!

There's also a global function `expressionBuilder` you can use to create expression builders:

```ts
import { expressionBuilder } from 'kysely'

// `eb1` has type `ExpressionBuilder<DB, never>` which means there are no tables in the
// context. This variant should be used most of the time in helper functions since you
// shouldn't make assumptions about the calling context.
const eb1 = expressionBuilder<DB>()

// `eb2` has type `ExpressionBuilder<DB, 'person'>`. You can reference `person` columns
// directly in all expression builder methods.
const eb2 = expressionBuilder<DB, 'person'>()

// In this one you'd have access to tables `person` and `pet` and all their columns.
const eb3 = expressionBuilder<DB, 'person' | 'pet'>()

let qb = query
  .selectFrom('person')
  .innerJoin('movie as m', 'm.director_id', 'person.id')

// You can also provide a query builder instance and the context is inferred automatically.
// Type of `eb` is `ExpressionBuilder<DB & { m: Movie }, 'person' | 'm'>`
const eb = expressionBuilder(qb)

qb = qb.where(eb.not(eb.exists(
  eb.selectFrom('pet')
    .select('pet.id')
    .whereRef('pet.name', '=', 'm.name')
)))
```

## Creating reusable helpers

The expression builder can be used to create reusable helper functions.
Let's say we have a complex `where` expression we want to reuse in multiple queries:

```ts
function hasDogNamed(name: string): Expression<boolean> {
  const eb = expressionBuilder<DB, 'person'>()

  return eb.exists(
    eb.selectFrom('pet')
      .select('pet.id')
      .whereRef('pet.owner_id', '=', 'person.id')
      .where('pet.species', '=', 'dog')
      .where('pet.name', '=', name)
  )
}
```

This helper can now be used in any query, and would work just fine if "person" table is in context:

```ts
const doggoPersons = await db
  .selectFrom('person')
  .selectAll('person')
  .where(hasDogNamed('Doggo'))
  .execute()
```

However, the above helper is not very type-safe. The following code would compile, but fail at runtime:

```ts
const bigFatFailure = await db
  .selectFrom('movie') // <-- "person" table is not in context!
  .selectAll('movie')
  .where(hasDogNamed('Doggo')) // <-- but we're referring to "person.id" in our helper
  .execute()
```

It's better to not make assumptions about the calling context and pass in all dependencies
as arguments. In the following example we pass in the person's id as an expression. We also
changed the type of `name` from `string` to `Expression<string>`, which allows us to pass
in arbitrary expressions instead of just values.

```ts
function hasDogNamed(name: Expression<string>, ownerId: Expression<number>) {
  // Create an expression builder without any tables in the context.
  // This way we make no assumptions about the calling context.
  const eb = expressionBuilder<DB>()

  return eb.exists(
    eb.selectFrom('pet')
      .select('pet.id')
      .where('pet.owner_id', '=', ownerId)
      .where('pet.species', '=', 'dog')
      .where('pet.name', '=', name)
  )
}
```

Here's how you'd use our brand new helper:

```ts
const doggoPersons = await db
  .selectFrom('person')
  .selectAll('person')
  .where((eb) => hasDogNamed(eb.val('Doggo'), eb.ref('person.id')))
  .execute()
```

Learn more about reusable helper functions [here](https://kysely.dev/docs/recipes/reusable-helpers).

## Conditional expressions

In the following, we'll only cover `where` expressions. The same logic applies to `having`, `on`, `orderBy`, `groupBy` etc.

> This section should not be confused with conditional selections in `select` clauses, which is a whole 'nother topic we discuss in [this recipe](https://kysely.dev/docs/recipes/conditional-selects).

Having a set of optional filters you want to combine using `and`, is the most basic and common use case of conditional `where` expressions.
Since the `where`, `having` and other filter functions are additive, most of the time this is enough:

```ts
let query = db
  .selectFrom('person')
  .selectAll('person')

if (firstName) {
  // The query builder is immutable. Remember to replace the builder
  // with the new one.
  query = query.where('first_name', '=', firstName)
}

if (lastName) {
  query = query.where('last_name', '=', lastName)
}

const persons = await query.execute()
```

The same query can be built using the expression builder like this:

```ts
const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .where((eb) => {
    const filters: Expression<SqlBool>[] = []

    if (firstName) {
      filters.push(eb('first_name', '=', firstName))
    }

    if (lastName) {
      filters.push(eb('last_name', '=', lastName))
    }

    return eb.and(filters)
  })
  .execute()
```

Using the latter design, you can build conditional expressions of any complexity.

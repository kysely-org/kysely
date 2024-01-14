# Conditional selects

Sometimes you may want to select some fields based on a runtime condition.
Something like this:

```ts
async function getPerson(id: number, withLastName: boolean) {}
```

If `withLastName` is true the person object is returned with a `last_name`
property, otherwise without it.

Your first thought can be to simply do this:

```ts
async function getPerson(id: number, withLastName: boolean) {
  let query = db.selectFrom('person').select('first_name').where('id', '=', id)

  if (withLastName) {
    // ❌ The type of `query` doesn't change here
    query = query.select('last_name')
  }

  // ❌ Wrong return type { first_name: string }
  return await query.executeTakeFirstOrThrow()
}
```

While that _would_ compile, the result type would be `{ first_name: string }`
without the `last_name` column, which is wrong. What happens is that the type
of `query` when created is something, let's say `A`. The type of the query
with `last_name` selection is `B` which extends `A` but also contains information
about the new selection. When you assign an object of type `B` to `query` inside
the `if` statement, the type gets downcast to `A`.

:::info
You _can_ write code like this to add conditional `where`, `groupBy`, `orderBy` etc.
statements that don't change the type of the query builder, but it doesn't work
with `select`, `returning`, `innerJoin` etc. that _do_ change the type of the
query builder.
:::

In this simple case you could implement the method like this:

```ts
async function getPerson(id: number, withLastName: boolean) {
  const query = db
    .selectFrom('person')
    .select('first_name')
    .where('id', '=', id)

  if (withLastName) {
    // ✅ The return type is { first_name: string, last_name: string }
    return await query.select('last_name').executeTakeFirstOrThrow()
  }

  // ✅ The return type is { first_name: string }
  return await query.executeTakeFirstOrThrow()
}
```

This works fine when you have one single condition. As soon as you have two or more
conditions the amount of code explodes if you want to keep things type-safe. You need
to create a separate branch for every possible combination of selections or otherwise
the types won't be correct.

This is where the [$if](https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#_if)
method can help you:

```ts
async function getPerson(id: number, withLastName: boolean) {
  // ✅ The return type is { first_name: string, last_name?: string }
  return await db
    .selectFrom('person')
    .select('first_name')
    .$if(withLastName, (qb) => qb.select('last_name'))
    .where('id', '=', id)
    .executeTakeFirstOrThrow()
}
```

Any selections added inside the `if` callback will be added as optional fields to the
output type since we can't know if the selections were actually made before running
the code.

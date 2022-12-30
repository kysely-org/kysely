# Dealing with the `Type instantiation is excessively deep and possibly infinite` error

Kysely uses complex type magic to achieve its type safety. This complexity is sometimes
too much for typescript and you get errors like this:

```
error TS2589: Type instantiation is excessively deep and possibly infinite.
```

In these case you can often use the [$assertType](https://koskimas.github.io/kysely/classes/SelectQueryBuilder.html#_assertType)
method to help typescript a little bit. When you use this method to assert the output type of a query, Kysely can drop the
complex output type that consists of multiple nested helper types and replace it with the simple asserted type.

Using this method doesn't reduce type safety at all. You have to pass in a type that is structurally equal to the current type.

For example having more than six `with` statements in a query can lead to the `TS2589` error:

```ts
  const res = await db
    .with('w1', (qb) => qb.selectFrom('person').select('first_name as fn1'))
    .with('w2', (qb) => qb.selectFrom('person').select('first_name as fn2'))
    .with('w3', (qb) => qb.selectFrom('person').select('first_name as fn3'))
    .with('w4', (qb) => qb.selectFrom('person').select('first_name as fn4'))
    .with('w5', (qb) => qb.selectFrom('person').select('first_name as fn5'))
    .with('w6', (qb) => qb.selectFrom('person').select('first_name as fn6'))
    .with('w7', (qb) => qb.selectFrom('person').select('first_name as fn7'))
    .selectFrom(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'])
    .selectAll()
    .executeTakeFirstOrThrow()
```

But if you simplify one or more of the `with` statements using `$assertType`, you get rid of the error:

```ts
  const res = await db
    .with('w1', (qb) => qb.selectFrom('person').select('first_name as fn1'))
    .with('w2', (qb) => qb.selectFrom('person').select('first_name as fn2'))
    .with('w3', (qb) => qb.selectFrom('person').select('first_name as fn3'))
    .with('w4', (qb) => qb.selectFrom('person').select('first_name as fn4'))
    .with('w5', (qb) => qb.selectFrom('person').select('first_name as fn5'))
    .with('w6', (qb) => qb.selectFrom('person').select('first_name as fn6'))
    .with('w7', (qb) => qb.selectFrom('person').select('first_name as fn7').$assertType<{ fn7: string }>())
    .selectFrom(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'])
    .selectAll()
    .executeTakeFirstOrThrow()
```

The type you provide for `$assertType` must be structurally equal to the return type of the subquery. Therefore no type safety is lost.

I know what you're thinking: can't this be done automatically? No, unfortunately it can't. There's no way to do this using current
typescript features. Typescript drags along all the parts the type is built with. Even though it could simplify the type into
a simple object, it doesn't. We need to explictly tell it to do that using the `$assertType` method.
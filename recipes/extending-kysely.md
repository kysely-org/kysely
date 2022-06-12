# Extending kysely

In many cases Kysely doesn't provide a built-in type-safe method for a feature. It's often because adding
that feature in a generic way that would work in all use cases would be really difficult or impossible.
It's often better to create little helper functions in your project that suit your use case. The generic 
feature would never work as well.

Let's take this query as an example:

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
  return sql`(values ${values})`.as<A>(aliasSql)
}
```

There's a lot going on in this function, but it's all documented in the
[sql template tag's documentation.](https://koskimas.github.io/kysely/modules.html#sql)

Most of the time a helper like this would return either an instance of `RawBuilder` or
`AliasedRawBuilder` and you'd create an instance using the `sql` template tag. You'd return a 
`RawBuilder` instance when only the data type of a column/table is needed and an `AliasedRawBuilder` 
when also the name of the column/table is needed. Our example function creates kind of a temporary 
table, so we need to tell Kysely both the type of the table AND the name of the table.

This is how you could now create our query using the `values` helper:

```ts
// This could come as an input from somewhere.
const records = [{
  id: 1,
  v1: 'foo',
  v2: 'bar'
}, {
  id: 2,
  v1: 'baz',
  v2: 'spam'
}]

db.insertInto('t')
  .columns(['t1', 't2'])
  .expression(
    // The `values` function automatically parses the column types
    // from the records and you can refer to them through the table
    // alias `v`. This works because Kysely is able to parse the
    // AliasedRawBuilder<T, A> type.
    db.selectFrom(values(records, 'v'))
      .innerJoin('j', 'v.id', 'j.vid')
      .select(['v.v1', 'j.j2'])
  )
```

## Extending using inheritance

You usually don't want to do this. Because of the complex types, you'll quickly run into problems.
Even though kysely uses classes, Kysely is not designed from the OOP point of view. Classes are
used because they are supported natively by typescript. They provide private variables and a nice 
discoverable API.
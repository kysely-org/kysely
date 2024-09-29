# Relations

<h3>
Kysely IS NOT an ORM. Kysely DOES NOT have the concept of relations.
Kysely IS a query builder. Kysely DOES build the SQL you tell it to, nothing more, nothing less.
</h3>

Phew, glad we got that out the way..

Having said all that, there are ways to nest related rows in your queries. You just have to do it
using the tools SQL and the underlying dialect (e.g. PostgreSQL, MySQL, or SQLite) provide. In this recipe
we show one way to do that when using the built-in PostgreSQL, MySQL, and SQLite dialects.

This recipe is supported on MySQL versions starting from 8.0.14. This is due to the way subqueries use outer references in this recipe (cf. [MySQL 8.0.14 changelog](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/news-8-0-14.html#mysqld-8-0-14-optimizer) | [MariaDB is not supported yet](https://jira.mariadb.org/browse/MDEV-19078)).

## The `json` data type and functions

PostgreSQL and MySQL have rich JSON support through their `json` data types and functions. `pg` and `mysql2`, the node drivers, automatically parse returned `json` columns as json objects. With the combination of these two things, we can write some super efficient queries with nested relations.

:::info[Parsing JSON]
The built in `SqliteDialect` and some third-party dialects don't parse the returned JSON columns to objects automatically.
Not even if they use `PostgreSQL` or `MySQL` under the hood! Parsing is handled (or not handled) by the database driver
that Kysely has no control over. If your JSON columns get returned as strings, you can use the `ParseJSONResultsPlugin`:

```ts
const db = new Kysely<DB>({
  ...
  plugins: [new ParseJSONResultsPlugin()]
})
```
:::

Let's start with some raw postgres SQL, and then see how we can write the query using Kysely in a nice type-safe way.

In the following query, we fetch a list of people (from "person" table) and for each person, we nest the person's pets, and mother, into the returned objects:

```sql
SELECT
  person.*,

  -- Select person's pets as a json array
  (
    SELECT
      COALESCE(JSON_AGG(pets), '[]')
    FROM
    (
      SELECT
        pet.id, pet.name
      FROM
        pet
      WHERE
        pet.owner_id = person.id
      ORDER BY
        pet.name
    ) pets
  ) pets,

  -- Select person's mother as a json object
  (
    SELECT
      TO_JSON(mother)
    FROM
    (
      SELECT
        mother.id, mother.first_name
      FROM
        person as mother
      WHERE
        mother.id = person.mother_id
    ) mother
  ) mother
FROM
  person
```

Simple right 😅. Yeah, not so much. But it does provide full control over the queries and a really good performance as long as you have indices (or indexes, we don't judge) for "pet.owner_id" and "person.mother_id".

Fortunately we can improve and simplify this a lot using Kysely. First let's define a couple of helpers:

```ts
function jsonArrayFrom<O>(expr: Expression<O>) {
  return sql<Simplify<O>[]>`(select coalesce(json_agg(agg), '[]') from ${expr} as agg)`
}

function jsonObjectFrom<O>(expr: Expression<O>) {
  return sql<Simplify<O>>`(select to_json(obj) from ${expr} as obj)`
}
```

These helpers are included in Kysely and you can import them from the `helpers` module like this:

```ts
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres'
```

MySQL and SQLite versions of the helpers are slightly different, but you can use them the same way. You can import them like this:

```ts
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/mysql'
```

```ts
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite'
```

With these helpers, our example query already becomes a little more bearable to look at:

```ts
const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .select((eb) => [
    // pets
    jsonArrayFrom(
      eb.selectFrom('pet')
        .select(['pet.id', 'pet.name'])
        .whereRef('pet.owner_id', '=', 'person.id')
        .orderBy('pet.name')
    ).as('pets'),

    // mother
    jsonObjectFrom(
      eb.selectFrom('person as mother')
        .select(['mother.id', 'mother.first_name'])
        .whereRef('mother.id', '=', 'person.mother_id')
    ).as('mother')
  ])
  .execute()

console.log(persons[0].pets[0].name)
console.log(persons[0].mother?.first_name)
```

That's better right? If you need to do this over and over in your codebase, you can create some helpers like these:

```ts
function pets(ownerId: Expression<string>) {
  return jsonArrayFrom(
    db.selectFrom('pet')
      .select(['pet.id', 'pet.name'])
      .where('pet.owner_id', '=', ownerId)
      .orderBy('pet.name')
  )
}

function mother(motherId: Expression<string>) {
  return jsonObjectFrom(
    db.selectFrom('person as mother')
      .select(['mother.id', 'mother.first_name'])
      .where('mother.id', '=', motherId)
  )
}
```

And now you get this:

```ts
const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .select(({ ref }) => [
    pets(ref('person.id')).as('pets'),
    mother(ref('person.mother_id')).as('mother')
  ])
  .execute()

console.log(persons[0].pets[0].name)
console.log(persons[0].mother?.first_name)
```

In some cases Kysely marks your selections as nullable if it's not able to know the related object
always exists. If you have that information, you can mark the relation non-null using the
`$notNull()` helper like this:

```ts
const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .select(({ ref }) => [
    pets(ref('person.id')).as('pets'),
    mother(ref('person.mother_id')).$notNull().as('mother')
  ])
  .execute()

console.log(persons[0].pets[0].name)
console.log(persons[0].mother.first_name)
```

If you need to select relations conditionally, `$if` is your friend:

```ts
const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .$if(includePets, (qb) => qb.select(
    (eb) => pets(eb.ref('person.id')).as('pets')
  ))
  .$if(includeMom, (qb) => qb.select(
    (eb) => mother(eb.ref('person.mother_id')).as('mother')
  ))
  .execute()
```

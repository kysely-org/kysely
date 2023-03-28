# Relations

Kysely is just a query builder and doesn't have the concept of relations. Kysely builds the SQL you tell it to and nothing more. This doesn't mean there's no way to nest related rows in your queries. You just have to do it with the tools SQL and the dialect provide. In this recipe we show one way to do that on PostgreSQL.

## PostgreSQL `jsonb` data type and functions

PostgreSQL has a rich JSON support through its `json` and `jsonb` data types and functions. The node PostgreSQL driver `pg` automatically parses returned `json` and `jsonb` columns as objects. With the combination of these two things, we can write some super efficient queries with nested relations.

Let's start with the raw SQL and then see how we can write the query using Kysely in a nice type-safe way.

In the following query, we fetch a list of persons and for each person, we nest the person's pets and the person's mother into the returned objects:

```ts
SELECT
  person.*,

  // Select person's pets as a jsonb array
  (
    SELECT 
      COALESCE(JSONB_AGG(pets), '[]')
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

  // Select person's mother as a jsonb object
  (
    SELECT 
      TO_JSONB(mother)
    FROM
    (
      SELECT 
        mother.*
      FROM
        person as mother
      WHERE 
        mother.id = person.mother_id
    ) mother
  ) mother
FROM
  person
```

Simple right 😅. Yeah, not so much. But it does provide 100% control over the queries and a really good performance as long as you have indices for `pet.owner_id` and `person.mother_id`.

Fortunately we can improve and simplify this a lot using kysely. First let's define couple of helpers:

```ts
function jsonArrayFrom<O>(
  expr: Expression<O>
): RawBuilder<Simplify<O>[]> {
  return sql`(select coalesce(jsonb_agg(agg), '[]') from ${expr} as agg)`
}

export function jsonObjectFrom<O>(
  expr: Expression<O>
): RawBuilder<Simplify<O>> {
  return sql`(select to_jsonb(obj) from ${expr} as obj)`
}
```

These helpers are included in kysely and you can import them from the `helpers` package like this:

```ts
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres'
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
        .selectAll('mother')
        .whereRef('mother.id', '=', 'person.mother_id')
    ).as('mother')
  ])

console.log(persons[0].pets[0].name)
console.log(persons[0].mother.last_name)
```

That's better right? If you need to do this over and over in your codebase, you can create some helpers like these:

```ts
function withPets(eb: ExpressionBuilder<DB, 'person'>) {
  return jsonArrayFrom(
    eb.selectFrom('pet')
      .select(['pet.id', 'pet.name'])
      .whereRef('pet.owner_id', '=', 'person.id')
      .orderBy('pet.name')
  ).as('pets')
}

function withMom(eb: ExpressionBuilder<DB, 'person'>) {
  return jsonObjectFrom(
    eb.selectFrom('person as mother')
      .selectAll('mother')
      .whereRef('mother.id', '=', 'person.mother_id')
  ).as('mother')
}
```

And now you get this:

```ts
const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .select((eb) => [
    withPets(eb),
    withMom(eb)
  ])

console.log(persons[0].pets[0].name)
console.log(persons[0].mother.last_name)
```
# Deduplicate joins

When building dynamic queries, you sometimes end up in situations where the same join
could be added twice. Consider this query:

```ts
async function getPerson(
  id: number,
  withPetName: boolean,
  withPetSpecies: boolean
) {
  return await db
    .selectFrom('person')
    .selectAll('person')
    .$if(withPetName, (qb) =>
      qb
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .select('pet.name as pet_name')
    )
    .$if(withPetSpecies, (qb) =>
      qb
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .select('pet.species as pet_species')
    )
    .where('person.id', '=', id)
    .executeTakeFirst()
}
```

We have two optional selections `pet_name` and `pet_species`. Both of them require
the `pet` table to be joined, but we don't want to add an unnecessary join if both
`withPetName` and `withPetSpecies` are `false`.

But if both `withPetName` and `withPetSpecies` are `true`, we end up with two identical
joins which will cause an error in the database.

To prevent the error from happening, you can install the
[DeduplicateJoinsPlugin](https://kysely-org.github.io/kysely-apidoc/classes/DeduplicateJoinsPlugin.html).
You can either install it globally by providing it in the configuration:

```ts
const db = new Kysely<Database>({
  dialect,
  plugins: [new DeduplicateJoinsPlugin()],
})
```

or you can use it when needed:

```ts
async function getPerson(
  id: number,
  withPetName: boolean,
  withPetSpecies: boolean
) {
  return await db
    .withPlugin(new DeduplicateJoinsPlugin())
    .selectFrom('person')
    .selectAll('person')
    .$if(withPetName, (qb) =>
      qb
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .select('pet.name as pet_name')
    )
    .$if(withPetSpecies, (qb) =>
      qb
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .select('pet.species as pet_species')
    )
    .where('person.id', '=', id)
    .executeTakeFirst()
}
```

You may wonder why this is a plugin and not the default behavior? The reason is that it's surprisingly
difficult to detect if two joins are identical. It's trivial for simple joins like the ones in the
example, but becomes quite complex with arbitrary joins with nested subqueries etc. There may be
corner cases where the `DeduplicateJoinsPlugin` fails and we don't want it to affect people that
don't need this deduplication (most people).

See [this recipe](/docs/recipes/conditional-selects)
if you are wondering why we are using the `$if` method.

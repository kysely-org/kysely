export const functionCalls = `const result = await db.selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select(({ fn }) => [
    'person.id',

    // The \`fn\` module contains the most common
    // functions.
    fn.count<number>('pet.id').as('pet_count'),

    // You can call any function using the
    // \`agg\` method
    fn.agg<string[]>('array_agg', ['pet.name']).as('pet_names')
  ])
  .groupBy('person.id')
  .having((eb) => eb.fn.count('pet.id'), '>', 10)
  .execute()`
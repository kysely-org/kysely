export const simpleInnerJoin = `const result = await db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  // \`select\` needs to come after the call to \`innerJoin\` so
  // that you can select from the joined table.
  .select(['person.id', 'pet.name as pet_name'])
  .execute()`
export const functionCalls = `import { sql } from 'kysely'

const result = await db.selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select(({ fn, val, ref }) => [
    'person.id',

    // The \`fn\` module contains the most common
    // functions.
    fn.count<number>('pet.id').as('pet_count'),

    // You can call any function by calling \`fn\`
    // directly. The arguments are treated as column
    // references by default. If you want  to pass in
    // values, use the \`val\` function.
    fn<string>('concat', [
      val('Ms. '),
      'first_name',
      val(' '),
      'last_name'
    ]).as('full_name_with_title'),

    // You can call any aggregate function using the
    // \`fn.agg\` function.
    fn.agg<string[]>('array_agg', ['pet.name']).as('pet_names'),

    // And once again, you can use the \`sql\`
    // template tag. The template tag substitutions
    // are treated as values by default. If you want
    // to reference columns, you can use the \`ref\`
    // function.
    sql<string>\`concat(
      \${ref('first_name')},
      ' ',
      \${ref('last_name')}
    )\`.as('full_name')
  ])
  .groupBy('person.id')
  .having((eb) => eb.fn.count('pet.id'), '>', 10)
  .execute()`
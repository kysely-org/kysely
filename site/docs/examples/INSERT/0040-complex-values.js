export const complexValues = `import { sql } from 'kysely'

const result = await db
  .insertInto('person')
  .values(({ ref, selectFrom, fn }) => ({
    first_name: 'Jennifer',
    last_name: sql\`\${'Ani'} || \${'ston'}\`,
    middle_name: ref('first_name'),
    age: selectFrom('person')
      .select(fn.avg<number>('age')
      .as('avg_age')),
  }))
  .executeTakeFirst()`
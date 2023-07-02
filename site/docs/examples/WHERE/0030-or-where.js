export const orWhere = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .where(({ or, and, cmpr }) => or([
    and([
      cmpr('first_name', '=', 'Jennifer'),
      cmpr('last_name', '=', 'Aniston')
    ]),
    and([
      cmpr('first_name', '=', 'Sylvester'),
      cmpr('last_name', '=', 'Stallone')
    ])
  ]))
  .execute()`
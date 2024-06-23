export const subqueryJoin = `const result = await db.selectFrom('person')
  .innerJoin(
    (eb) => eb
      .selectFrom('pet')
      .select(['owner_id as owner', 'name'])
      .where('name', '=', 'Doggo')
      .as('doggos'),
    (join) => join
      .onRef('doggos.owner', '=', 'person.id'),
  )
  .selectAll('doggos')
  .execute()`
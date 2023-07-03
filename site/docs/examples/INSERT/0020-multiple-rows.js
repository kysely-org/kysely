export const multipleRows = `await db
  .insertInto('person')
  .values([{
    first_name: 'Jennifer',
    last_name: 'Aniston',
    age: 40,
  }, {
    first_name: 'Arnold',
    last_name: 'Schwarzenegger',
    age: 70,
  }])
  .execute()`
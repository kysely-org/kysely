export const createTable = `await db.schema
  .createTable("person")
  .ifNotExists()
  .addColumn("id", "serial", (cb) => cb.primaryKey())
  .addColumn("first_name", "varchar", (cb) => cb.notNull())
  .addColumn("last_name", "varchar")
  .addColumn("gender", "varchar(10)", (cb) => cb.notNull())
  .addUniqueConstraint('person_name_unique', ['first_name', 'last_name'], 'nulls not distinct')
  .execute();
  
// The third option in addUniqueConstraint method is only available in PostgreSQL`

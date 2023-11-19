export const createTable = `await db.schema
  .createTable("person")
  .addColumn("id", "serial", (cb) => cb.primaryKey())
  .addColumn("first_name", "varchar", (cb) => cb.notNull())
  .addColumn("last_name", "varchar")
  .addColumn("gender", "varchar(10)", (cb) => cb.notNull())
  .execute();`

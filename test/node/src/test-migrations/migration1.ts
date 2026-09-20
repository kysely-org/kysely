import { defineMigration } from '../../../../dist/migration/index.js'

export default defineMigration({
  async up(db) {
    await db.schema
      .createTable('test1')
      .addColumn('id', 'integer', (col) => col.primaryKey())
      .execute()
  },

  async down(db) {
    await db.schema.dropTable('test1').execute()
  },
})

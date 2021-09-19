import { Kysely } from '../../../lib/index.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('test2')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('test1_id', 'integer', (col) => col.references('test1.id'))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('test2').execute()
}

import { Kysely } from '../../src'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('test2')
    .addColumn('integer', 'id', (col) => col.primaryKey())
    .addColumn('integer', 'test1_id', (col) => col.references('test1.id'))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('test2').execute()
}

import { Kysely } from '../../src'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('test1')
    .addColumn('integer', 'id', (col) => col.primaryKey())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('test1').execute()
}

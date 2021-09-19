import { Kysely } from '../../../'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('test1')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('test1').execute()
}

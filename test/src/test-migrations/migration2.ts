import { Kysely } from '../../../'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('test2')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('test1_id', 'integer', (col) => col.references('test1.id'))
    .execute()
}

// Down migration is missing on purpose. It's optional.

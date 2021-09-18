import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user')
    .addColumn('user_id', 'uuid', (col) =>
      col.primaryKey().defaultTo(db.raw('gen_random_uuid()'))
    )
    .addColumn('first_name', 'text', (col) => col.notNull())
    .addColumn('last_name', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.unique())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(db.raw('NOW()'))
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user').execute()
}

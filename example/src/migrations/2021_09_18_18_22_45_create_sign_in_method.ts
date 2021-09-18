import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('sign_in_method')
    .addColumn('user_id', 'uuid', (col) =>
      col.references('user.user_id').notNull().onDelete('cascade')
    )
    .addColumn('type', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('sign_in_method_primary_key', ['user_id', 'type'])
    .execute()

  await db.schema
    .createTable('password_sign_in_method')
    .addColumn('user_id', 'uuid', (col) =>
      col.references('user.user_id').notNull().primaryKey().onDelete('cascade')
    )
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('sign_in_method_user_id_index')
    .on('sign_in_method')
    .column('user_id')
    .execute()

  await db.schema
    .createIndex('password_sign_in_method_user_id_index')
    .on('password_sign_in_method')
    .column('user_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sign_in_method').execute()
  await db.schema.dropTable('password_sign_in_method').execute()
}

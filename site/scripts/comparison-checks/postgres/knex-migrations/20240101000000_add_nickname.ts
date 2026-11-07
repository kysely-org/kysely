import type { Knex } from 'knex'
import type { Kysely } from 'kysely'

export async function up(_: Knex, kysely: Kysely<any>): Promise<void> {
  await kysely.schema
    .alterTable('person')
    .addColumn('nickname', 'text')
    .execute()
}

export async function down(_: Knex, kysely: Kysely<any>): Promise<void> {
  await kysely.schema.alterTable('person').dropColumn('nickname').execute()
}

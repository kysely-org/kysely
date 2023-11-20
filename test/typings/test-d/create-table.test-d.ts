import { expectError } from 'tsd'
import { Kysely } from '..'
import { Database } from '../shared'

async function testCreateTableWithAsStatement(db: Kysely<Database>) {
  expectError(db.schema.createTable('test').as())
  expectError(db.schema.createTable('test').as('test'))
}

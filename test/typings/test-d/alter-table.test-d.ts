import { expectError } from 'tsd'
import { Kysely } from '..'
import { Database } from '../shared'

async function testAlterTableWithAddUniqueConstraint(db: Kysely<Database>) {
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint('a_unique', null)
  )
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint('a_unique', [1])
  )
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint(null, ['a'], (uc) => uc.nullsNotDistinct())
  )
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint('a_unique', [1], (uc) => uc.nullsNotDistinct())
  )
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint('a_unique', ['a'], 'wrong option')
  )
}

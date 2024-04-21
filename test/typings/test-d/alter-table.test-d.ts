import { expectError, expectType } from 'tsd'
import { AlterTableBuilder, Kysely } from '..'
import { Database } from '../shared'
import { AlterTableExecutor } from '../../../dist/cjs/schema/alter-table-executor'

async function testAlterTableWithAddUniqueConstraint(db: Kysely<Database>) {
  expectType<AlterTableBuilder>(db.schema.alterTable('test'))

  expectType<AlterTableExecutor>(
    db.schema.alterTable('test').addUniqueConstraint('a_unique', ['a']),
  )

  expectType<AlterTableExecutor>(
    db.schema
      .alterTable('test')
      .addUniqueConstraint('a_unique', ['a'], (uc) => uc.nullsNotDistinct()),
  )

  expectError(
    db.schema.alterTable('test').addUniqueConstraint('a_unique', null),
  )
  expectError(db.schema.alterTable('test').addUniqueConstraint('a_unique', [1]))
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint(null, ['a'], (uc) => uc.nullsNotDistinct()),
  )
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint('a_unique', [1], (uc) => uc.nullsNotDistinct()),
  )
  expectError(
    db.schema
      .alterTable('test')
      .addUniqueConstraint('a_unique', ['a'], 'wrong option'),
  )
}

import { expectError, expectAssignable, expectNotAssignable } from 'tsd'
import { Kysely, sql } from '..'
import { Database } from '../shared'

async function testCreateTableWithAddUniqueConstraint(db: Kysely<Database>) {
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint(null, ['a'], 'nulls not distinct')
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', [1], 'nulls distinct')
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', ['a'], 'wrong option')
  )
}

import { expectError } from 'tsd'
import { Kysely } from '..'
import { Database } from '../shared'

async function testCreateTableWithAddUniqueConstraint(db: Kysely<Database>) {
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint(null, ['a'], (uc) => uc.nullsNotDistinct())
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', [1], (uc) => uc.nullsNotDistinct())
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', ['a'], 'wrong option')
  )
}
  
async function testCreateTableWithAsStatement(db: Kysely<Database>) {
  expectError(db.schema.createTable('test').as())
  expectError(db.schema.createTable('test').as('test'))
}

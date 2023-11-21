import { expectError, expectType } from 'tsd'
import { CreateTableBuilder, Kysely } from '..'
import { Database } from '../shared'

async function testCreateTableWithSeveralColumns(db: Kysely<Database>) {
  expectType<CreateTableBuilder<'person'>>(db.schema.createTable('person'))

  expectType<CreateTableBuilder<'person', 'a'>>(
    db.schema.createTable('person').addColumn('a', 'varchar(255)')
  )

  expectError(
    db.schema
      .createTable(1)
      .addColumn('a', 'varchar(255)')
      .addColumn('b', 'varchar(255)')
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn(null, 'varchar(255)')
      .addColumn('b', 'varchar(255)')
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addColumn('b', 'test_type')
  )
}

async function testCreateTableWithAddUniqueConstraint(db: Kysely<Database>) {
  expectType<CreateTableBuilder<'person', 'a'>>(
    db.schema
      .createTable('person')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', ['a'])
  )

  expectType<CreateTableBuilder<'person', 'a'>>(
    db.schema
      .createTable('person')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', ['a'], (uc) => uc.nullsNotDistinct())
  )

  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint(1, ['a'])
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', 'test')
  )
  expectError(
    db.schema
      .createTable('test')
      .addColumn('a', 'varchar(255)')
      .addUniqueConstraint('a_unique', [1])
  )
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

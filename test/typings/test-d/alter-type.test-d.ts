import { expectError, expectType } from 'tsd'
import { AlterTableBuilder, Kysely } from '..'
import { Database } from '../shared'
import { AlterTypeExecutor } from '../../../dist/cjs/schema/alter-type-executor'
import { AlterTypeBuilder } from '../../../dist/cjs/schema/alter-type-builder.js'
async function testAlterType(db: Kysely<Database>) {
  expectType<AlterTypeBuilder>(db.schema.alterType('test'))
  expectType<AlterTypeExecutor>(db.schema.alterType('test').ownerTo('user'))
  expectType<AlterTypeExecutor>(db.schema.alterType('test').renameTo('test2'))
  expectType<AlterTypeExecutor>(db.schema.alterType('test').setSchema('test2'))
  expectType<AlterTypeExecutor>(
    db.schema.alterType('test').renameValue('test', 'test2'),
  )
  expectType<AlterTypeExecutor>(db.schema.alterType('test').addValue('test'))
  expectType<AlterTypeExecutor>(
    db.schema
      .alterType('test')
      .addValue('test', (qb) => qb.ifNotExists().after('test2')),
  )
}

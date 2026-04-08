import { expectError } from 'tsd'
import type { Kysely } from '../index.js'
import type { Database } from '../shared.js'

async function testAlterType(db: Kysely<Database>) {
  db.schema.alterType('my_type').addValue('value').execute()
  db.schema.alterType('my_type').addValue('value').ifNotExists().execute()
  db.schema.alterType('my_type').addValue('value').after('another_value')
  db.schema.alterType('my_type').addValue('value').before('another_value')

  expectError(db.schema.alterType('my_type').addValue('value').after('value'))
  expectError(db.schema.alterType('my_type').addValue('value').before('value'))

  db.schema.alterType('my_type').renameTo('another_type')

  expectError(db.schema.alterType('my_type').renameTo('my_type'))

  db.schema.alterType('my_type').renameValue('value', 'another_value')

  expectError(
    db.schema.alterType('my_type').renameValue(
      'value',
      'value', // compilation error!
    ),
  )

  db.schema.alterType('my_type').setSchema('another_schema')
  db.schema.alterType('my_schema.my_type').setSchema('another_schema')

  expectError(db.schema.alterType('my_schema.my_type').setSchema('my_schema'))
}

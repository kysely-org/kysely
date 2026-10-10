import Admonition from '@theme/Admonition'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import { IUseADifferentDialect } from './IUseADifferentDialect'
import {
  DEFAULT_DIALECT,
  DEFAULT_PACKAGE_MANAGER,
  DIALECTS,
  getKyselyImportPath,
  PACKAGE_MANAGERS,
  useSearchState,
  type Dialect,
  type PropsWithDialect,
  type PropsWithPackageManager,
} from './shared'

const postgresqlCodeSnippet = `    await db.schema.createTable('person')
      .addColumn('id', 'serial', (cb) => cb.primaryKey())
      .addColumn('first_name', 'varchar', (cb) => cb.notNull())
      .addColumn('last_name', 'varchar')
      .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
      .addColumn('created_at', 'timestamp', (cb) =>
        cb.notNull().defaultTo(sql\`now()\`)
      )
      .execute()`

const dialectSpecificCodeSnippets: Record<Dialect, string> = {
  postgresql: postgresqlCodeSnippet,
  mysql: `    await db.schema.createTable('person')
      .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
      .addColumn('first_name', 'varchar(255)', (cb) => cb.notNull())
      .addColumn('last_name', 'varchar(255)')
      .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
      .addColumn('created_at', 'timestamp', (cb) =>
        cb.notNull().defaultTo(sql\`now()\`)
      )
      .execute()`,
  // TODO: Update line 42's IDENTITY once identity(1,1) is added to core.
  mssql: `    await db.schema.createTable('person')
      .addColumn('id', 'integer', (cb) => cb.primaryKey().modifyEnd(sql\`identity\`))
      .addColumn('first_name', 'varchar(255)', (cb) => cb.notNull())
      .addColumn('last_name', 'varchar(255)')
      .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
      .addColumn('created_at', 'datetime', (cb) =>
        cb.notNull().defaultTo(sql\`GETDATE()\`)
      )
      .execute()`,
  sqlite: `    await db.schema.createTable('person')
      .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement().notNull())
      .addColumn('first_name', 'varchar(255)', (cb) => cb.notNull())
      .addColumn('last_name', 'varchar(255)')
      .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
      .addColumn('created_at', 'timestamp', (cb) =>
        cb.notNull().defaultTo(sql\`current_timestamp\`)
      )
      .execute()`,
  pglite: postgresqlCodeSnippet,
}

const truncateTableSnippet = `await sql\`truncate table \${sql.table('person')}\`.execute(db)`

const dialectSpecificTruncateSnippets: Record<Dialect, string> = {
  postgresql: truncateTableSnippet,
  mysql: truncateTableSnippet,
  mssql: truncateTableSnippet,
  sqlite: `await sql\`delete from \${sql.table('person')}\`.execute(db)`,
  pglite: truncateTableSnippet,
}

export function Summary(props: PropsWithDialect<PropsWithPackageManager>) {
  const dialect = useSearchState({
    defaultValue: DEFAULT_DIALECT,
    searchParam: props.dialectSearchParam,
    validator: (value) => DIALECTS.includes(value as never),
    value: props.dialect,
  })
  const packageManager = useSearchState({
    defaultValue: DEFAULT_PACKAGE_MANAGER,
    searchParam: props.packageManagerSearchParam,
    validator: (value) => PACKAGE_MANAGERS.includes(value as never),
    value: props.packageManager,
  })

  const dialectSpecificCodeSnippet = dialectSpecificCodeSnippets[dialect]
  const dialectSpecificTruncateSnippet =
    dialectSpecificTruncateSnippets[dialect]

  return (
    <>
      <p>
        We've seen how to install and instantiate Kysely, its dialects and
        underlying drivers. We've also seen how to use Kysely to query a
        database.
        <br />
        <br />
        <strong>Let's put it all to the test:</strong>
      </p>
      <CodeBlock language="ts" title="src/PersonRepository.test.ts">
        {`import * as assert from 'node:assert/strict'
import { after, afterEach, before, describe, it } from 'node:test'
import { sql } from '${getKyselyImportPath(packageManager)}'
import { db } from './database'
import * as PersonRepository from './PersonRepository'

describe('PersonRepository', () => {
  before(async () => {
${dialectSpecificCodeSnippet}
  })
    
  afterEach(async () => {
    ${dialectSpecificTruncateSnippet}
  })
    
  after(async () => {
    await db.schema.dropTable('person').execute()
    await db.destroy()
  })
    
  it('should find a person with a given id', async () => {
    const created = await PersonRepository.createPerson({
      first_name: 'Arnold',
      last_name: null,
      gender: 'man',
    })
    assert.ok(created)

    const found = await PersonRepository.findPersonById(created.id)
    assert.equal(found?.first_name, 'Arnold')
  })
    
  it('should find all people named Arnold', async () => {
    await PersonRepository.createPerson({
      first_name: 'Arnold', last_name: null, gender: 'man',
    })
    await PersonRepository.createPerson({
      first_name: 'Jennifer', last_name: null, gender: 'woman',
    })

    const people = await PersonRepository.findPeople({ first_name: 'Arnold' })
    assert.equal(people.length, 1)
    assert.equal(people[0].first_name, 'Arnold')
  })
    
  it('should update gender of a person with a given id', async () => {
    const created = await PersonRepository.createPerson({
      first_name: 'Arnold', last_name: null, gender: 'man',
    })
    assert.ok(created)

    await PersonRepository.updatePerson(created.id, { gender: 'woman' })
    const updated = await PersonRepository.findPersonById(created.id)
    assert.equal(updated?.gender, 'woman')
  })
    
  it('should create a person', async () => {
    const created = await PersonRepository.createPerson({
      first_name: 'Jennifer',
      last_name: 'Aniston',
      gender: 'woman',
    })
    assert.ok(created)
    assert.equal(created.first_name, 'Jennifer')
  })
    
  it('should delete a person with a given id', async () => {
    const created = await PersonRepository.createPerson({
      first_name: 'Arnold', last_name: null, gender: 'man',
    })
    assert.ok(created)

    const deleted = await PersonRepository.deletePerson(created.id)
    assert.equal(deleted?.id, created.id)
    assert.equal(await PersonRepository.findPersonById(created.id), undefined)
  })
})`}
      </CodeBlock>
      <IUseADifferentDialect
        dialect={dialect}
        dialectSelectionID={props.dialectSelectionID}
      />
      <Admonition type="info" title="Migrations">
        As you can see, Kysely supports DDL queries. It also supports classic
        "up/down" migrations. Find out more at{' '}
        <Link to="/docs/migrations">Migrations</Link>.
      </Admonition>
    </>
  )
}

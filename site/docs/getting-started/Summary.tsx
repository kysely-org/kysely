import Admonition from '@theme/Admonition'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import { IUseADifferentDialect } from './IUseADifferentDialect'
import {
  DEFAULT_DIALECT,
  DIALECTS,
  useSearchState,
  type Dialect,
  type PropsWithDialect,
} from './shared'

const dialectSpecificCodeSnippets: Record<Dialect, string> = {
  postgresql: `    await db.schema.createTable('person')
      .addColumn('id', 'serial', (cb) => cb.primaryKey())
      .addColumn('first_name', 'varchar', (cb) => cb.notNull())
      .addColumn('last_name', 'varchar')
      .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
      .addColumn('created_at', 'timestamp', (cb) =>
        cb.notNull().defaultTo(sql\`now()\`)
      )
      .execute()`,
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
}

const dialectSpecificTruncateSnippets: Record<Dialect, string> = {
  postgresql: `await sql\`truncate table \${sql.table('person')}\`.execute(db)`,
  mysql: `await sql\`truncate table \${sql.table('person')}\`.execute(db)`,
  mssql: `await sql\`truncate table \${sql.table('person')}\`.execute(db)`,
  sqlite: `await sql\`delete from \${sql.table('person')}\`.execute(db)`,
}

export function Summary(props: PropsWithDialect) {
  const dialect = useSearchState({
    defaultValue: DEFAULT_DIALECT,
    searchParam: props.dialectSearchParam,
    validator: (value) => DIALECTS.includes(value as never),
    value: props.dialect,
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
      <CodeBlock language="ts" title="src/PersonRepository.spec.ts">
        {`import { sql } from 'kysely'
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
  })
    
  it('should find a person with a given id', async () => {
    await PersonRepository.findPersonById(123)
  })
    
  it('should find all people named Arnold', async () => {
    await PersonRepository.findPeople({ first_name: 'Arnold' })
  })
    
  it('should update gender of a person with a given id', async () => {
    await PersonRepository.updatePerson(123, { gender: 'woman' })
  })
    
  it('should create a person', async () => {
    await PersonRepository.createPerson({
      first_name: 'Jennifer',
      last_name: 'Aniston',
      gender: 'woman',
    })
  })
    
  it('should delete a person with a given id', async () => {
    await PersonRepository.deletePerson(123)
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

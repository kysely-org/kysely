import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

export const libraries = {
  kysely: { label: 'Kysely 0.29.8' },
  'kysely-next': { label: 'Kysely 0.30.0-beta.2' },
  'drizzle-stable': { label: 'Drizzle 0.45.4' },
  'drizzle-rc': { label: 'Drizzle 1.0.0-rc.5' },
}
export const tableCounts = [10, 100, 1000]
export const queries = [
  'by-id',
  'select-all',
  'left-join',
  'three-joins',
  'group-by',
  'subquery',
  'cte',
  'insert',
  'update',
  'filters',
]
// baseline: the library, a client, and the schema, with no query.
// all: the ten queries. all-plus-<query>: the ten, and that query written
// again over a second set of tables. all-twice: all ten written again.
export const cases = [
  'baseline',
  'all',
  ...queries.map((query) => `all-plus-${query}`),
  'all-twice',
]

// One table shape for both libraries. person, pet, and toy are the tables the
// queries read, and person_b, pet_b, and toy_b the tables their twins read; the
// rest fill the schema, each with one column of its own so no two tables have
// the same type.
const coreTables = ['person', 'pet', 'toy', 'person_b', 'pet_b', 'toy_b']

// The same query over the second set of tables.
const twin = (source) =>
  source
    .replace(/\b(person|pet|toy)\b/g, '$1_b')
    .replace(/active_pets/g, 'active_pets_b')

function tableNames(count) {
  const names = [...coreTables]
  for (let i = names.length; i < count; i++) {
    names.push(`filler_${String(i).padStart(4, '0')}`)
  }
  return names
}

const pascal = (name) =>
  name.replace(/(^|_)([a-z0-9])/g, (_, __, c) => c.toUpperCase())

function kyselySchema(names, pkg) {
  const tables = names.map((name) => {
    const extra = coreTables.includes(name) ? '' : `  ${name}_code: string\n`
    return `export interface ${pascal(name)}Table {
  id: GeneratedAlways<number>
  name: string
  description: string | null
  owner_id: number
  score: number | null
  active: boolean
  created_at: GeneratedTimestamp
  updated_at: Timestamp | null
${extra}}
`
  })
  return `import type { ColumnType, GeneratedAlways } from '${pkg}'

export type Timestamp = ColumnType<Date, Date | string, Date | string>
export type GeneratedTimestamp = ColumnType<
  Date,
  Date | string | undefined,
  Date | string
>

${tables.join('\n')}
export interface Database {
${names.map((name) => `  ${name}: ${pascal(name)}Table`).join('\n')}
}
`
}

function drizzleSchema(names, pkg) {
  const tables = names.map((name) => {
    const extra = coreTables.includes(name)
      ? ''
      : `  ${name}_code: text().notNull(),\n`
    return `export const ${name} = pgTable('${name}', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  description: text(),
  owner_id: integer().notNull(),
  score: integer(),
  active: boolean().notNull(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }),
${extra}})
`
  })
  return `import { boolean, integer, pgTable, text, timestamp } from '${pkg}/pg-core'

${tables.join('\n')}`
}

export const ddl = coreTables
  .map(
    (name) => `create table ${name} (
  id integer generated always as identity primary key,
  name text not null,
  description text,
  owner_id integer not null,
  score integer,
  active boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);`,
  )
  .join('\n')

const personRow = `{
  id: number
  name: string
  description: string | null
  owner_id: number
  score: number | null
  active: boolean
  created_at: Date
  updated_at: Date | null
}`

// Each query is written once per library and assigned to the same written-out
// row type, so the whole result type is resolved in both.
const rows = {
  'by-id': '{ id: number; name: string }',
  'select-all': personRow,
  'left-join': '{ name: string; pet_name: string | null }',
  'three-joins': `{
  person_id: number
  person_name: string
  pet_id: number
  pet_name: string
  toy_id: number
  toy_name: string
}`,
  'group-by': '{ owner_id: number; pets: number; top_score: number | null }',
  subquery: '{ id: number; name: string }',
  cte: '{ name: string; pet_name: string }',
  insert: '{ id: number }',
  update: '{ id: number; name: string }',
  filters: '{ id: number; name: string }',
}

const kyselyQueries = {
  'by-id': `  return await db
    .selectFrom('person')
    .select(['id', 'name'])
    .where('id', '=', 1)
    .execute()`,
  'select-all': `  return await db
    .selectFrom('person')
    .selectAll()
    .where('active', '=', true)
    .orderBy('created_at', 'desc')
    .orderBy('id')
    .limit(20)
    .execute()`,
  'left-join': `  return await db
    .selectFrom('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .select(['person.name', 'pet.name as pet_name'])
    .where('person.score', '>=', 18)
    .orderBy('person.name')
    .orderBy('pet.name')
    .execute()`,
  'three-joins': `  return await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .innerJoin('toy', 'toy.owner_id', 'pet.id')
    .select([
      'person.id as person_id',
      'person.name as person_name',
      'pet.id as pet_id',
      'pet.name as pet_name',
      'toy.id as toy_id',
      'toy.name as toy_name',
    ])
    .where((eb) =>
      eb.and([
        eb('person.active', '=', true),
        eb.or([eb('pet.score', '>=', 5), eb('toy.score', 'is', null)]),
      ]),
    )
    .orderBy('toy.id')
    .execute()`,
  'group-by': `  return await db
    .selectFrom('pet')
    .select((eb) => [
      'owner_id',
      eb.fn.countAll<number>().as('pets'),
      eb.fn.max('score').as('top_score'),
    ])
    .groupBy('owner_id')
    .having((eb) => eb(eb.fn.countAll(), '>', 1))
    .orderBy('owner_id')
    .execute()`,
  subquery: `  return await db
    .selectFrom('person')
    .select(['id', 'name'])
    .where('id', 'in', (eb) =>
      eb.selectFrom('pet').select('owner_id').where('active', '=', true),
    )
    .orderBy('id')
    .execute()`,
  cte: `  return await db
    .with('active_pets', (qb) =>
      qb.selectFrom('pet').select(['owner_id', 'name']).where('active', '=', true),
    )
    .selectFrom('person')
    .innerJoin('active_pets', 'active_pets.owner_id', 'person.id')
    .select(['person.name', 'active_pets.name as pet_name'])
    .orderBy('person.name')
    .orderBy('active_pets.name')
    .execute()`,
  insert: `  return await db
    .insertInto('pet')
    .values({ name: 'Hammo', owner_id: 1, active: true })
    .returning('id')
    .execute()`,
  update: `  return await db
    .updateTable('pet')
    .set({ name: 'Doggo II', score: 7 })
    .where('id', '=', 2)
    .returning(['id', 'name'])
    .execute()`,
  filters: `  let query = db.selectFrom('person').select(['id', 'name'])
  if (options.name !== undefined) {
    query = query.where('name', '=', options.name)
  }
  if (options.minScore !== undefined) {
    query = query.where('score', '>=', options.minScore)
  }
  if (options.active !== undefined) {
    query = query.where('active', '=', options.active)
  }
  return await query.orderBy('id').execute()`,
}

const drizzleQueries = {
  'by-id': {
    operators: ['eq'],
    tables: ['person'],
    body: `  return await db
    .select({ id: person.id, name: person.name })
    .from(person)
    .where(eq(person.id, 1))`,
  },
  'select-all': {
    operators: ['desc', 'eq'],
    tables: ['person'],
    body: `  return await db
    .select()
    .from(person)
    .where(eq(person.active, true))
    .orderBy(desc(person.created_at), person.id)
    .limit(20)`,
  },
  'left-join': {
    operators: ['eq', 'gte'],
    tables: ['person', 'pet'],
    body: `  return await db
    .select({ name: person.name, pet_name: pet.name })
    .from(person)
    .leftJoin(pet, eq(pet.owner_id, person.id))
    .where(gte(person.score, 18))
    .orderBy(person.name, pet.name)`,
  },
  'three-joins': {
    operators: ['and', 'eq', 'gte', 'isNull', 'or'],
    tables: ['person', 'pet', 'toy'],
    body: `  return await db
    .select({
      person_id: person.id,
      person_name: person.name,
      pet_id: pet.id,
      pet_name: pet.name,
      toy_id: toy.id,
      toy_name: toy.name,
    })
    .from(person)
    .innerJoin(pet, eq(pet.owner_id, person.id))
    .innerJoin(toy, eq(toy.owner_id, pet.id))
    .where(
      and(
        eq(person.active, true),
        or(gte(pet.score, 5), isNull(toy.score)),
      ),
    )
    .orderBy(toy.id)`,
  },
  'group-by': {
    operators: ['count', 'gt', 'max'],
    tables: ['pet'],
    body: `  return await db
    .select({
      owner_id: pet.owner_id,
      pets: count(),
      top_score: max(pet.score),
    })
    .from(pet)
    .groupBy(pet.owner_id)
    .having(gt(count(), 1))
    .orderBy(pet.owner_id)`,
  },
  subquery: {
    operators: ['eq', 'inArray'],
    tables: ['person', 'pet'],
    body: `  return await db
    .select({ id: person.id, name: person.name })
    .from(person)
    .where(
      inArray(
        person.id,
        db
          .select({ owner_id: pet.owner_id })
          .from(pet)
          .where(eq(pet.active, true)),
      ),
    )
    .orderBy(person.id)`,
  },
  cte: {
    operators: ['eq'],
    tables: ['person', 'pet'],
    body: `  const activePets = db
    .$with('active_pets')
    .as(
      db
        .select({ owner_id: pet.owner_id, name: pet.name })
        .from(pet)
        .where(eq(pet.active, true)),
    )
  return await db
    .with(activePets)
    .select({ name: person.name, pet_name: activePets.name })
    .from(person)
    .innerJoin(activePets, eq(activePets.owner_id, person.id))
    .orderBy(person.name, activePets.name)`,
  },
  insert: {
    operators: [],
    tables: ['pet'],
    body: `  return await db
    .insert(pet)
    .values({ name: 'Hammo', owner_id: 1, active: true })
    .returning({ id: pet.id })`,
  },
  update: {
    operators: ['eq'],
    tables: ['pet'],
    body: `  return await db
    .update(pet)
    .set({ name: 'Doggo II', score: 7 })
    .where(eq(pet.id, 2))
    .returning({ id: pet.id, name: pet.name })`,
  },
  filters: {
    operators: ['and', 'eq', 'gte', 'type SQL'],
    tables: ['person'],
    body: `  const filters: SQL[] = []
  if (options.name !== undefined) {
    filters.push(eq(person.name, options.name))
  }
  if (options.minScore !== undefined) {
    filters.push(gte(person.score, options.minScore))
  }
  if (options.active !== undefined) {
    filters.push(eq(person.active, options.active))
  }
  return await db
    .select({ id: person.id, name: person.name })
    .from(person)
    .where(and(...filters))
    .orderBy(person.id)`,
  },
}

const signature = (query) =>
  query === 'filters'
    ? `export async function run(
  options: { name?: string; minScore?: number; active?: boolean } = {
    minScore: 18,
  },
): Promise<Row[]> {`
    : 'export async function run(): Promise<Row[]> {'

const isKysely = (library) => library.startsWith('kysely')

function queryModule(library, query) {
  const head = `type Row = ${rows[query]}\n\n${signature(query)}`
  if (isKysely(library)) {
    return `import { db } from './db.ts'\n\n${head}\n${kyselyQueries[query]}\n}\n`
  }
  const { operators, tables, body } = drizzleQueries[query]
  const operatorImport = operators.length
    ? `import { ${operators.join(', ')} } from '${library}'\n`
    : ''
  return `${operatorImport}import { db } from './db.ts'
import { ${tables.join(', ')} } from './schema.ts'

${head}
${body}
}
`
}

function dbModule(library) {
  if (isKysely(library)) {
    return `import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect } from '${library}'
import type { Database } from './schema.ts'

export const client = new PGlite()
export const db = new Kysely<Database>({
  dialect: new PGliteDialect({ pglite: client }),
})
`
  }
  return `import { PGlite } from '@electric-sql/pglite'
import { drizzle } from '${library}/pglite'

export const client = new PGlite()
export const db = drizzle({ client })
`
}

const tsconfig = (file) =>
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2023',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        allowImportingTsExtensions: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        types: ['node'],
      },
      files: [file],
    },
    null,
    2,
  )

export function caseDirectory(library, tableCount) {
  return join(root, 'generated', library, String(tableCount))
}

export function generate() {
  rmSync(join(root, 'generated'), { recursive: true, force: true })
  for (const library of Object.keys(libraries)) {
    for (const tableCount of tableCounts) {
      const dir = caseDirectory(library, tableCount)
      mkdirSync(dir, { recursive: true })
      const names = tableNames(tableCount)
      const files = {
        'schema.ts': isKysely(library)
          ? kyselySchema(names, library)
          : drizzleSchema(names, library),
        'db.ts': dbModule(library),
        'baseline.ts': `import './db.ts'\nimport './schema.ts'\n`,
        'all.ts': queries.map((query) => `import './${query}.ts'\n`).join(''),
        'all-twice.ts':
          `import './all.ts'\n` +
          queries.map((query) => `import './${query}.twin.ts'\n`).join(''),
      }
      for (const query of queries) {
        const source = queryModule(library, query)
        files[`${query}.ts`] = source
        files[`${query}.twin.ts`] = twin(source)
        files[`all-plus-${query}.ts`] =
          `import './all.ts'\nimport './${query}.twin.ts'\n`
      }
      for (const name of cases) {
        files[`tsconfig.${name}.json`] = tsconfig(`${name}.ts`)
      }
      for (const [name, content] of Object.entries(files)) {
        writeFileSync(join(dir, name), content)
      }
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generate()
  console.log('Generated', join(root, 'generated'))
}

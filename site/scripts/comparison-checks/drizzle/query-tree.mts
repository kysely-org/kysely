import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import {
  Kysely,
  OperationNodeTransformer,
  PGliteDialect,
  SelectQueryNode,
  sql,
  type IdentifierNode,
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
} from 'kysely'
import { and as stableAnd, eq as stableEq } from 'drizzle-stable'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { drizzle as stableProxy } from 'drizzle-stable/pg-proxy'
import { and as rcAnd, eq as rcEq } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcPgTable,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { drizzle as rcProxy } from 'drizzle-rc/pg-proxy'

interface Database {
  person: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
}

class ReadOnlyPlugin implements KyselyPlugin {
  transformQuery({ node }: PluginTransformQueryArgs) {
    if (!SelectQueryNode.is(node)) {
      throw new Error('This instance is read-only.')
    }
    return node
  }

  async transformResult({ result }: PluginTransformResultArgs) {
    return result
  }
}

// The exported transformer visits every node, so it finds a write below the root.
class RefuseWrites extends OperationNodeTransformer {
  protected override transformInsertQuery(): never {
    throw new Error('This instance is read-only.')
  }
  protected override transformUpdateQuery(): never {
    throw new Error('This instance is read-only.')
  }
  protected override transformDeleteQuery(): never {
    throw new Error('This instance is read-only.')
  }
  protected override transformMergeQuery(): never {
    throw new Error('This instance is read-only.')
  }
}

class UppercaseIdentifiers extends OperationNodeTransformer {
  protected override transformIdentifier(node: IdentifierNode): IdentifierNode {
    return { ...node, name: node.name.toUpperCase() }
  }
}

const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const reports = db.withPlugin(new ReadOnlyPlugin())

function renamePet(handle: Kysely<Database>, id: number, name: string) {
  return handle.updateTable('pet').set({ name }).where('id', '=', id)
}

const stablePet = pgTable('pet', {
  id: integer().notNull(),
  name: text().notNull(),
  owner_id: integer().notNull(),
})
const rcPet = rcPgTable('pet', {
  id: rcInteger().notNull(),
  name: rcText().notNull(),
  owner_id: rcInteger().notNull(),
})
const stableDb = stableProxy(async () => ({ rows: [] }))
const rcDb = rcProxy(async () => ({ rows: [] }))

function compileChecks() {
  // @ts-expect-error a Drizzle builder's clause config is protected.
  void stableDb.select().from(stablePet).config
  // @ts-expect-error a Drizzle builder's clause config is protected.
  void rcDb.select().from(rcPet).config
}
void compileChecks

function chunkKinds(chunk: any): unknown {
  if (Array.isArray(chunk)) return chunk.map(chunkKinds)
  if (chunk?.queryChunks) return chunk.queryChunks.map(chunkKinds)
  return chunk?.constructor?.name ?? typeof chunk
}

try {
  await pglite.exec(
    "create table person(id integer,first_name text,age integer);create table pet(id integer,name text,owner_id integer);insert into pet values(1,'Catto',1),(2,'Doggo',2)",
  )

  // The query is a public tree before it is SQL.
  const tree = db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select('person.id')
    .where('person.age', '>=', 18)
    .limit(5)
    .toOperationNode()
  assert.equal(tree.kind, 'SelectQueryNode')
  assert.equal(tree.joins?.[0]?.kind, 'JoinNode')
  assert.equal(tree.joins?.[0]?.joinType, 'InnerJoin')
  assert.equal(tree.where?.kind, 'WhereNode')
  assert.equal(tree.limit?.kind, 'LimitNode')

  // The exported transformer rewrites it.
  const upper = new UppercaseIdentifiers().transformNode(tree)
  assert.notEqual(upper, tree)
  assert.match(JSON.stringify(upper), /"name":"PERSON"/)
  assert.doesNotMatch(JSON.stringify(tree), /"name":"PERSON"/)

  // A custom plugin sees the root node of every statement the instance builds.
  assert.deepEqual(
    await reports.selectFrom('pet').select('id').orderBy('id').execute(),
    [{ id: 1 }, { id: 2 }],
  )
  const writes = [
    reports.insertInto('pet').values({ id: 3, name: 'Hammo', owner_id: 1 }),
    reports.updateTable('pet').set({ name: 'x' }).where('id', '=', 1),
    reports.deleteFrom('pet').where('id', '=', 1),
    reports
      .mergeInto('pet')
      .using('person', 'person.id', 'pet.owner_id')
      .whenMatched()
      .thenDelete(),
    // A write built by a helper that only receives the instance.
    renamePet(reports, 1, 'x'),
  ]
  for (const write of writes) {
    assert.throws(() => write.compile(), /read-only/)
    await assert.rejects(write.execute(), /read-only/)
  }
  // A statement written whole as a template is a raw node, so it is refused
  // too, whatever it says.
  await assert.rejects(sql`delete from pet`.execute(reports), /read-only/)
  await assert.rejects(sql`select 1`.execute(reports), /read-only/)
  assert.deepEqual(
    await db.selectFrom('pet').select(['id', 'name']).orderBy('id').execute(),
    [
      { id: 1, name: 'Catto' },
      { id: 2, name: 'Doggo' },
    ],
    'nothing was changed by a refused statement',
  )
  // withPlugin derives an instance; the original is unchanged.
  assert.equal(
    renamePet(db, 1, 'x').compile().sql,
    'update "pet" set "name" = $1 where "id" = $2',
  )

  // What the guard does not see: it reads the root node, and a select with a
  // data-modifying CTE is a select.
  const nested = reports
    .with('gone', (qb) =>
      qb.deleteFrom('pet').where('id', '=', 2).returning('id'),
    )
    .selectFrom('gone')
    .select('id')
  assert.equal(nested.toOperationNode().kind, 'SelectQueryNode')
  assert.throws(
    () => new RefuseWrites().transformNode(nested.toOperationNode()),
    /read-only/,
  )
  const plainSelect = reports.selectFrom('pet').select('id').toOperationNode()
  assert.equal(
    JSON.stringify(new RefuseWrites().transformNode(plainSelect)),
    JSON.stringify(plainSelect),
  )
  assert.deepEqual(await nested.execute(), [{ id: 2 }])
  assert.deepEqual(await db.selectFrom('pet').select('id').execute(), [
    { id: 1 },
  ])

  // Drizzle: the statement is chunks of text, names, columns, and parameters.
  for (const [label, drizzleDb, pet, eq, and] of [
    ['stable', stableDb, stablePet, stableEq, stableAnd],
    ['rc', rcDb, rcPet, rcEq, rcAnd],
  ] as const) {
    const built = (drizzleDb as any)
      .select({ id: (pet as any).id })
      .from(pet)
      .where((eq as any)((pet as any).owner_id, 1))
      .getSQL()
    const kinds = new Set(
      (chunkKinds(built) as unknown[]).flat(Infinity) as string[],
    )
    for (const kind of kinds) {
      assert.match(
        kind,
        /^(StringChunk|Name|Param|PgInteger|PgTable|undefined)$/,
        `${label}: unexpected chunk kind ${kind}`,
      )
    }
    assert(kinds.has('StringChunk'), label)
    // Drizzle's documented conditional filters with nothing collected.
    const filters: any[] = []
    assert.equal((and as any)(...filters), undefined, label)
    assert.equal(
      (drizzleDb as any)
        .delete(pet)
        .where((and as any)(...filters))
        .toSQL().sql,
      'delete from "pet"',
      label,
    )
  }

  console.log(
    'PASS: Kysely exposes the query as operation nodes, an exported transformer rewrites it, and a custom plugin makes a derived instance read-only, refusing every insert, update, delete, merge, and template statement however it was composed, but not a data-modifying CTE inside a select, which the exported transformer finds; a Drizzle builder keeps its clauses in a protected config and yields text, name, column, and parameter chunks',
  )
} finally {
  await db.destroy()
}

import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import {
  DeleteQueryNode,
  Kysely,
  OperationNodeTransformer,
  PGliteDialect,
  UpdateQueryNode,
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

class RequireWherePlugin implements KyselyPlugin {
  transformQuery({ node }: PluginTransformQueryArgs) {
    if ((DeleteQueryNode.is(node) || UpdateQueryNode.is(node)) && !node.where) {
      throw new Error('Refusing to change every row: add a where clause.')
    }
    return node
  }

  async transformResult({ result }: PluginTransformResultArgs) {
    return result
  }
}

class UppercaseIdentifiers extends OperationNodeTransformer {
  protected override transformIdentifier(node: IdentifierNode): IdentifierNode {
    return { ...node, name: node.name.toUpperCase() }
  }
}

const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const guarded = db.withPlugin(new RequireWherePlugin())

function deletePets(options: { ownerId?: number }) {
  let query = guarded.deleteFrom('pet')
  if (options.ownerId) query = query.where('owner_id', '=', options.ownerId)
  return query
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

  // A custom plugin sees the final statement, however it was composed.
  assert.equal(
    deletePets({ ownerId: 1 }).compile().sql,
    'delete from "pet" where "owner_id" = $1',
  )
  assert.throws(() => deletePets({}).compile(), /add a where clause/)
  await assert.rejects(deletePets({}).execute(), /add a where clause/)
  assert.throws(
    () => guarded.updateTable('pet').set({ name: 'x' }).compile(),
    /add a where clause/,
  )
  const scoped = <T extends { where: (...args: any[]) => T }>(query: T) =>
    query.where('owner_id', '=', 2)
  assert.equal(
    scoped(guarded.deleteFrom('pet')).compile().sql,
    'delete from "pet" where "owner_id" = $1',
  )
  assert.equal(
    (await db.selectFrom('pet').select('id').execute()).length,
    2,
    'nothing was deleted by a refused statement',
  )
  // withPlugin derives an instance; the original is unchanged.
  assert.equal(db.deleteFrom('pet').compile().sql, 'delete from "pet"')

  // What the guard does not see: a statement written whole as a template,
  // and a where clause that is always true.
  assert.equal(
    sql`delete from pet where false`.compile(guarded).sql,
    'delete from pet where false',
  )
  assert.equal(
    guarded
      .deleteFrom('pet')
      .where((eb) => eb.and([]))
      .compile().sql,
    'delete from "pet" where 1 = 1',
  )

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
    'PASS: Kysely exposes the query as operation nodes, an exported transformer rewrites it, and a custom plugin refuses an unfiltered delete or update however the query was composed, but not a template statement or an always-true filter; a Drizzle builder keeps its clauses in a protected config and yields text, name, column, and parameter chunks',
  )
} finally {
  await db.destroy()
}

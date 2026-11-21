import type {
  DeleteResult,
  InsertResult,
  Kysely,
  MergeResult,
  UpdateResult,
} from '../index.js'
import { expectType } from 'tsd'

async function testKyselyAnySelects(db: Kysely<any>) {
  const r1 = await db.selectFrom('foo').select('bar').execute()
  expectType<{ bar: any }[]>(r1)

  const r2 = await db.selectFrom('foo').select(['bar', 'baz']).execute()
  expectType<{ bar: any; baz: any }[]>(r2)

  const r3 = await db.selectFrom('foo').select('foo.bar').execute()
  expectType<{ bar: any }[]>(r3)

  const r4 = await db
    .selectFrom('foo')
    .select(['spam', 'foo.bar', 'foo.baz'])
    .execute()
  expectType<{ spam: any; bar: any; baz: any }[]>(r4)

  const r5 = await db
    .selectFrom(['foo1', 'foo2'])
    .select(['spam', 'foo1.bar', 'foo2.baz', 'doesnotexists.fux'])
    .execute()
  expectType<{ spam: any; bar: any; baz: any; fux: any }[]>(r5)

  const r6 = await db
    .selectFrom('foo')
    .select((eb) => [
      eb.lit(1).as('baz'),
      eb.ref('foo.bar').as('bar'),
      eb
        .selectFrom('bar')
        .select('spam')
        .whereRef('foo.id', '=', 'bar.id')
        .as('spam'),
    ])
    .executeTakeFirstOrThrow()
  expectType<{ bar: any; spam: any; baz: 1 }>(r6)

  const table: 'foo' | 'bar' = Math.random() > 0.5 ? 'foo' : 'bar'
  const r7 = await db.selectFrom(table).select('baz').executeTakeFirstOrThrow()
  expectType<{ baz: any }>(r7)

  const r8 = await db.selectFrom('foo as f').select('bar').execute()
  expectType<{ bar: any }[]>(r8)

  const r9 = await db
    .selectFrom(['foo1 as f1', 'foo2 as f2'])
    .select(['spam', 'f1.bar', 'f2.baz', 'doesnotexists.fux'])
    .execute()
  expectType<{ spam: any; bar: any; baz: any; fux: any }[]>(r9)
}

async function testKyselyAnyInserts(db: Kysely<any>) {
  const r1 = await db
    .insertInto('foo')
    .values({ bar: 'baz', spam: 1 })
    .executeTakeFirstOrThrow()
  expectType<InsertResult>(r1)

  const r2 = await db
    .insertInto('foo')
    .values({ bar: 'baz', spam: 1 })
    .returning('foo')
    .executeTakeFirstOrThrow()
  expectType<{ foo: any }>(r2)

  const r3 = await db
    .insertInto('foo')
    .values({ bar: 'baz', spam: 1 })
    .returning(['foo', 'baz'])
    .executeTakeFirstOrThrow()
  expectType<{ foo: any; baz: any }>(r3)

  const r4 = await db
    .insertInto('foo')
    .values((eb) => ({ foo: eb.ref('foo.bar') }))
    .executeTakeFirstOrThrow()
  expectType<InsertResult>(r4)

  const table: 'foo' | 'bar' = Math.random() > 0.5 ? 'foo' : 'bar'
  const r5 = await db
    .insertInto(table)
    .values((eb) => ({ foo: eb.ref('foo.bar') }))
    .executeTakeFirstOrThrow()
  expectType<InsertResult>(r5)
}

async function testKyselyAnyUpdates(db: Kysely<any>) {
  const r1 = await db
    .updateTable('foo')
    .set({ bar: 'baz', spam: 1 })
    .where('foo.eggs', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<UpdateResult>(r1)

  const r2 = await db
    .updateTable('foo as f')
    .set({ bar: 'baz', spam: 1 })
    .where('f.eggs', '=', 1)
    .where('spam', '=', 2)
    .executeTakeFirstOrThrow()
  expectType<UpdateResult>(r2)

  const r3 = await db
    .updateTable('foo')
    .set({ bar: 'baz', spam: 1 })
    .where('foo.eggs', '=', 1)
    .where('spam', '=', 2)
    .returning(['a', 'b'])
    .executeTakeFirstOrThrow()
  expectType<{ a: any; b: any }>(r3)

  const r4 = await db
    .updateTable('foo')
    .set((eb) => ({
      foo: eb('foo.bar', '=', 1),
    }))
    .where('foo.eggs', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<UpdateResult>(r4)

  const table: 'foo' | 'bar' = Math.random() > 0.5 ? 'foo' : 'bar'
  const r5 = await db
    .updateTable(table)
    .set((eb) => ({
      foo: eb('foo.bar', '=', 1),
    }))
    .where('foo.eggs', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<UpdateResult>(r5)
}

async function testKyselyAnyDeletes(db: Kysely<any>) {
  const r1 = await db
    .deleteFrom('foo')
    .where('foo.eggs', '=', 1)
    .where('spam', '=', 2)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r1)

  const r2 = await db
    .deleteFrom('foo as f')
    .where('f.eggs', '=', 1)
    .where('spam', '=', 2)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r2)

  const r3 = await db
    .deleteFrom('foo')
    .where('foo.eggs', '=', 1)
    .where('spam', '=', 2)
    .returning(['a', 'b'])
    .executeTakeFirstOrThrow()
  expectType<{ a: any; b: any }>(r3)

  const table: 'foo' | 'bar' = Math.random() > 0.5 ? 'foo' : 'bar'
  const r4 = await db
    .deleteFrom(table)
    .where('baz', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r4)
}

async function testKyselyAnyMerges(db: Kysely<any>) {
  const r1 = await db
    .mergeInto('foo')
    .using('bar as b', 'b.id', 'foo.id')
    .whenMatchedAnd('b.eggs', '=', 1)
    .thenUpdateSet({ spam: 2 })
    .executeTakeFirstOrThrow()
  expectType<MergeResult>(r1)

  const r2 = await db
    .mergeInto('foo')
    .using('bar as b', 'b.id', 'foo.id')
    .whenMatched()
    .thenDelete()
    .returning(['b.eggs', 'foo.spam'])
    .executeTakeFirstOrThrow()
  expectType<{ eggs: any; spam: any }>(r2)

  const r3 = await db
    .mergeInto('foo')
    .using('bar as b', 'b.id', 'foo.id')
    .whenMatched()
    .thenDelete()
    .returningAll()
    .executeTakeFirstOrThrow()
  expectType<{ [x: string]: any }>(r3)

  const r4 = await db
    .mergeInto('foo')
    .using('bar as b', 'b.id', 'foo.id')
    .whenMatched()
    .thenDelete()
    .returningAll('b')
    .executeTakeFirstOrThrow()
  expectType<{ [x: string]: any }>(r4)

  const r5 = await db
    .mergeInto('foo')
    .using(db.selectFrom('bar').selectAll().as('b'), 'b.id', 'foo.id')
    .whenMatched()
    .thenDelete()
    .returning((eb) => eb.ref('b.eggs').as('e'))
    .executeTakeFirstOrThrow()
  expectType<{ e: any }>(r5)
}

async function testKyselyAnyJoins(db: Kysely<any>) {
  const r1 = await db
    .selectFrom('foo')
    .innerJoin('bar as b', 'b.foo_id', 'foo.id')
    .select(['b.eggs', 'foo.spam'])
    .executeTakeFirstOrThrow()
  expectType<{ eggs: any; spam: any }>(r1)

  const r2 = await db
    .selectFrom('foo')
    .leftJoin('bar', 'bar.foo_id', 'foo.id')
    .rightJoin('baz', 'baz.bar_id', 'bar.id')
    .fullJoin('qux as q', 'q.id', 'foo.id')
    .select(['foo.spam', 'bar.eggs', 'baz.ham', 'q.toast'])
    .executeTakeFirstOrThrow()
  expectType<{ spam: any; eggs: any; ham: any; toast: any }>(r2)

  const r3 = await db
    .selectFrom('foo')
    .innerJoin('bar as foo', 'foo.id', 'foo.bar_id')
    .selectAll('foo')
    .executeTakeFirstOrThrow()
  expectType<{ [x: string]: any }>(r3)
}

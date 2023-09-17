import { DeleteResult, Kysely, UpdateResult } from '..'
import { expectType } from 'tsd'

async function testKyselyAnySelects(db: Kysely<any>) {
  const r1 = await db.selectFrom('foo').select('bar').execute()
  expectType<
    {
      bar: any
    }[]
  >(r1)

  const r2 = await db.selectFrom('foo').select(['bar', 'baz']).execute()
  expectType<
    {
      bar: any
      baz: any
    }[]
  >(r2)

  const r3 = await db
    .selectFrom('foo')
    .select('foo.bar')
    .where('foo.spam', '=', 1)
    .execute()
  expectType<
    {
      bar: any
    }[]
  >(r3)

  const r4 = await db
    .selectFrom('foo')
    .select(['spam', 'foo.bar', 'foo.baz'])
    .execute()
  expectType<
    {
      spam: any
      bar: any
      baz: any
    }[]
  >(r4)

  const r5 = await db
    .selectFrom(['foo1', 'foo2'])
    .select(['spam', 'foo1.bar', 'foo2.baz', 'doesnotexists.fux'])
    .where('foo1.lol', '=', 'something')
    .where('foo2.lol', '<', new Date())
    .execute()
  expectType<
    {
      spam: any
      bar: any
      baz: any
      fux: never
    }[]
  >(r5)

  const r6 = await db
    .selectFrom('foo as bar')
    .select('bar.spam')
    .where('bar.baz', '=', false)
    .execute()
  expectType<
    {
      spam: any
    }[]
  >(r6)

  const r7 = await db
    .selectFrom((eb) => eb.selectFrom('spam').select('id').as('s'))
    .select(['foo', 'bar', 's.spam'])
    .execute()
  expectType<
    {
      foo: any
      bar: any
      spam: any
    }[]
  >(r7)
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
}

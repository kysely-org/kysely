import { Kysely } from '../index'
import { Database } from '../shared'
import { expectType } from 'tsd'

type CustomString = string & { __toString: Function };
type ConvertToCustomString<T> = {
  [K in keyof T]: T[K] extends string | null 
    ? (T[K] extends string ? CustomString : CustomString | null)
    : T[K];
};

async function testCastUsing(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .select(['first_name', 'last_name'])
    .$castUsing((_) => {
      return _ as unknown as ConvertToCustomString<typeof _>;
    })
    .executeTakeFirstOrThrow()

  expectType<{ first_name: CustomString, last_name: CustomString | null }>(r1)
}

import { expectError, expectType } from 'tsd'
import { Kysely, DeleteResult } from '..'
import { Database } from '../shared'

async function testDelete(db: Kysely<Database>) {
  const r1 = await db.deleteFrom('pet').where('id', '=', '1').executeTakeFirst()
  expectType<DeleteResult>(r1)

  const r2 = await db
    .deleteFrom('person')
    .using('pet')
    .where('pet.species', '=', 'cat')
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r2)

  const r3 = await db
    .deleteFrom('person')
    .using(['pet', 'toy'])
    .where('pet.species', '=', 'cat')
    .orWhere('toy.price', '=', 0)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r3)

  const r4 = await db
    .deleteFrom('person')
    .using(['person', 'pet'])
    .innerJoin('toy', 'toy.pet_id', 'pet.id')
    .where('pet.species', '=', 'cat')
    .orWhere('toy.price', '=', 0)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r4)

  const r5 = await db
    .deleteFrom('person')
    .using(['person', 'pet'])
    .leftJoin('toy', 'toy.pet_id', 'pet.id')
    .where('pet.species', '=', 'cat')
    .orWhere('toy.price', '=', 0)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r5)

  const r6 = await db
    .deleteFrom(['person', 'pet'])
    .using('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .where('person.id', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r6)

  const r7 = await db
    .deleteFrom(['person', 'pet'])
    .using('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .where('person.id', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r7)

  expectError(db.deleteFrom('NO_SUCH_TABLE'))
  expectError(db.deleteFrom('pet').where('NO_SUCH_COLUMN', '=', '1'))
  expectError(db.deleteFrom('pet').whereRef('owner_id', '=', 'NO_SUCH_COLUMN'))
  expectError(db.deleteFrom(['pet', 'NO_SUCH_TABLE']))
  expectError(db.deleteFrom('pet').using('NO_SUCH_TABLE'))
  expectError(db.deleteFrom('pet').using(['pet', 'NO_SUCH_TABLE']))
  expectError(
    db.deleteFrom('pet').using('pet').innerJoin('NO_SUCH_TABLE', 'pet.id', 'b')
  )
  expectError(
    db
      .deleteFrom('pet')
      .using('pet')
      .innerJoin('person', 'NO_SUCH_COLUMN', 'pet.owner_id')
  )
  expectError(
    db.deleteFrom('pet').using('pet').leftJoin('NO_SUCH_TABLE', 'pet.id', 'b')
  )
  expectError(
    db
      .deleteFrom('pet')
      .using('pet')
      .leftJoin('person', 'NO_SUCH_COLUMN', 'pet.owner_id')
  )
}

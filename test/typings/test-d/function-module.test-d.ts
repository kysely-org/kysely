import {
  expectError,
  expectAssignable,
  expectNotAssignable,
  expectType,
} from 'tsd'
import { Kysely } from '..'
import { Database } from '../shared'

async function testSelectWithoutAs(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  expectError(
    db.selectFrom('person').select(avg('age')).executeTakeFirstOrThrow()
  )

  expectError(
    db.selectFrom('person').select(avg<number>('age')).executeTakeFirstOrThrow()
  )

  expectError(
    db.selectFrom('person').select(count('age')).executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(count<number>('age'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db.selectFrom('person').select(max('age')).executeTakeFirstOrThrow()
  )

  expectError(
    db.selectFrom('person').select(min('age')).executeTakeFirstOrThrow()
  )

  expectError(
    db.selectFrom('person').select(sum('age')).executeTakeFirstOrThrow()
  )

  expectError(
    db.selectFrom('person').select(sum<number>('age')).executeTakeFirstOrThrow()
  )
}

async function testSelectWithDefaultGenerics(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(avg('age').as('avg_age'))
    .select(count('age').as('total_people'))
    .select(max('age').as('max_age'))
    .select(min('age').as('min_age'))
    .select(sum('age').as('total_age'))
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithCustomGenerics(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(avg<number>('age').as('avg_age'))
    .select(count<number>('age').as('total_people'))
    .select(max('age').as('max_age'))
    .select(min('age').as('min_age'))
    .select(sum<number>('age').as('total_age'))
    .executeTakeFirstOrThrow()

  expectAssignable<number>(result.avg_age)
  expectNotAssignable<string | bigint>(result.avg_age)
  expectAssignable<number>(result.total_people)
  expectNotAssignable<string | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectNotAssignable<string | bigint>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectNotAssignable<string | bigint>(result.min_age)
  expectAssignable<number>(result.total_age)
  expectNotAssignable<string | bigint>(result.total_age)
}

async function testSelectWithUnexpectedColumn(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  expectError(
    db
      .selectFrom('person')
      .select(avg('no_such_column').as('avg_age'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(avg<number>('no_such_column').as('avg_age'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(count('no_such_column').as('total_people'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(count<number>('no_such_column').as('total_people'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(max('no_such_column').as('max_age'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(min('no_such_column').as('min_age'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(sum('no_such_column').as('total_age'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(sum<number>('no_such_column').as('total_age'))
      .executeTakeFirstOrThrow()
  )
}

async function testSelectWithDynamicReference(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const dynamicColumn = Math.random().toString()

  const dynamicReference = db.dynamic.ref(dynamicColumn)

  const result = await db
    .selectFrom('person')
    .select(avg(dynamicReference).as('avg'))
    .select(avg<number>(dynamicReference).as('another_avg'))
    .select(count(dynamicReference).as('count'))
    .select(count<bigint>(dynamicReference).as('another_count'))
    .select(max(dynamicReference).as('max'))
    .select(max<number>(dynamicReference).as('another_max'))
    .select(min(dynamicReference).as('min'))
    .select(max<string>(dynamicReference).as('another_min'))
    .select(sum(dynamicReference).as('sum'))
    .select(sum<number>(dynamicReference).as('another_sum'))
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg)
  expectNotAssignable<bigint>(result.avg)
  expectAssignable<number>(result.another_avg)
  expectNotAssignable<string | bigint>(result.another_avg)
  expectAssignable<string | number | bigint>(result.count)
  expectAssignable<bigint>(result.another_count)
  expectNotAssignable<string | number>(result.another_count)
  expectAssignable<string | number | bigint>(result.max)
  expectAssignable<number>(result.another_max)
  expectNotAssignable<string | bigint>(result.another_max)
  expectAssignable<string | number | bigint>(result.min)
  expectAssignable<string>(result.another_min)
  expectNotAssignable<number | bigint>(result.another_min)
  expectAssignable<string | number | bigint>(result.sum)
  expectAssignable<number>(result.another_sum)
  expectNotAssignable<string | bigint>(result.another_sum)
}

async function testSelectWithDistinct(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(avg('age').distinct().as('avg_age'))
    .select(count('age').distinct().as('total_people'))
    .select(max('age').distinct().as('max_age'))
    .select(min('age').distinct().as('min_age'))
    .select(sum('age').distinct().as('total_age'))
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOver(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(avg('age').over().as('avg_age'))
    .select(count('age').over().as('total_people'))
    .select(max('age').over().as('max_age'))
    .select(min('age').over().as('min_age'))
    .select(sum('age').over().as('total_age'))
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOverAndPartitionBySingle(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(
      avg('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('avg_age')
    )
    .select(
      count('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('total_people')
    )
    .select(
      max('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('max_age')
    )
    .select(
      min('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('min_age')
    )
    .select(
      sum('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('total_age')
    )
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOverAndPartitionByMultiple(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(
      avg('age')
        .over((ob) => ob.partitionBy(['gender']))
        .as('avg_age')
    )
    .select(
      count('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name')
        )
        .as('total_people')
    )
    .select(
      max('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name')
        )
        .as('max_age')
    )
    .select(
      min('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name')
        )
        .as('min_age')
    )
    .select(
      sum('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name')
        )
        .as('total_age')
    )
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOverAndPartitionByUnexpectedColumns(
  db: Kysely<Database>
) {
  const { avg, count, max, min, sum } = db.fn

  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        count('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        count('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        max('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        max('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        min('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        min('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        sum('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        sum('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
}

async function testSelectWithOverAndOrderBySingle(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(
      avg('age')
        .over((ob) => ob.orderBy('gender'))
        .as('avg_age')
    )
    .select(
      count('age')
        .over((ob) => ob.orderBy('gender'))
        .as('total_people')
    )
    .select(
      max('age')
        .over((ob) => ob.orderBy('gender'))
        .as('max_age')
    )
    .select(
      min('age')
        .over((ob) => ob.orderBy('gender'))
        .as('min_age')
    )
    .select(
      sum('age')
        .over((ob) => ob.orderBy('gender'))
        .as('total_age')
    )
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOverAndOrderByMultiple(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(
      avg('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('avg_age')
    )
    .select(
      count('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('total_people')
    )
    .select(
      max('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('max_age')
    )
    .select(
      min('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('min_age')
    )
    .select(
      sum('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('total_age')
    )
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOverAndOrderByUnexpectedColumns(
  db: Kysely<Database>
) {
  const { avg, count, max, min, sum } = db.fn

  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        count('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        max('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        min('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        sum('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age')
      )
      .executeTakeFirst()
  )
}

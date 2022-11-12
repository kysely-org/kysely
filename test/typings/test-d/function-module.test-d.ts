import { expectError, expectAssignable, expectNotAssignable } from 'tsd'
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
  expectNotAssignable<null>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectNotAssignable<null>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectNotAssignable<string | bigint | null>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectNotAssignable<string | bigint | null>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
  expectNotAssignable<null>(result.total_age)
}

async function testSelectWithCustomGenerics(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(avg<number>('age').as('avg_age'))
    .select(avg<number | null>('age').as('nullable_avg_age'))
    .select(count<number>('age').as('total_people'))
    .select(max<number | null, 'age'>('age').as('nullable_max_age'))
    .select(min<number | null, 'age'>('age').as('nullable_min_age'))
    .select(sum<number>('age').as('total_age'))
    .select(sum<number | null>('age').as('nullable_total_age'))
    .executeTakeFirstOrThrow()

  expectAssignable<number>(result.avg_age)
  expectNotAssignable<string | bigint | null>(result.avg_age)
  expectAssignable<number | null>(result.nullable_avg_age)
  expectNotAssignable<string | bigint>(result.nullable_avg_age)
  expectAssignable<number>(result.total_people)
  expectNotAssignable<string | bigint | null>(result.total_people)
  expectAssignable<number | null>(result.nullable_max_age)
  expectNotAssignable<string | bigint>(result.nullable_max_age)
  expectAssignable<number | null>(result.nullable_min_age)
  expectNotAssignable<string | bigint>(result.nullable_min_age)
  expectAssignable<number>(result.total_age)
  expectNotAssignable<string | bigint | null>(result.total_age)
  expectAssignable<number | null>(result.nullable_total_age)
  expectNotAssignable<string | bigint>(result.nullable_total_age)

  expectError(
    db
      .selectFrom('person')
      .select(max<string>('age').as('max_lie_return_type'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(max<string, 'age'>('age').as('another_max_lie_return_type'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(
        max<number | null>('age').as(
          'max_explicit_return_type_but_no_string_ref'
        )
      )
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(min<string>('age').as('min_lie_return_type'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(min<string, 'age'>('age').as('another_min_lie_return_type'))
      .executeTakeFirstOrThrow()
  )

  expectError(
    db
      .selectFrom('person')
      .select(
        min<number | null>('age').as(
          'min_explicit_return_type_but_no_string_ref'
        )
      )
      .executeTakeFirstOrThrow()
  )
}

async function testSelectUnexpectedColumn(db: Kysely<Database>) {
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
    .select(avg<number | null>(dynamicReference).as('nullable_avg'))
    .select(count(dynamicReference).as('count'))
    .select(count<bigint>(dynamicReference).as('another_count'))
    .select(max(dynamicReference).as('max'))
    .select(max<number>(dynamicReference).as('another_max'))
    .select(max<number | null>(dynamicReference).as('nullable_max'))
    .select(min(dynamicReference).as('min'))
    .select(min<string>(dynamicReference).as('another_min'))
    .select(max<string | null>(dynamicReference).as('nullable_min'))
    .select(sum(dynamicReference).as('sum'))
    .select(sum<number>(dynamicReference).as('another_sum'))
    .select(sum<number | null>(dynamicReference).as('nullable_sum'))
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg)
  expectNotAssignable<bigint | null>(result.avg)
  expectAssignable<number>(result.another_avg)
  expectNotAssignable<string | bigint | null>(result.another_avg)
  expectAssignable<number | null>(result.nullable_avg)
  expectNotAssignable<string | bigint>(result.nullable_avg)
  expectAssignable<string | number | bigint>(result.count)
  expectNotAssignable<null>(result.count)
  expectAssignable<bigint>(result.another_count)
  expectNotAssignable<string | number | null>(result.another_count)
  expectAssignable<string | number | bigint>(result.max)
  expectNotAssignable<null>(result.max)
  expectAssignable<number>(result.another_max)
  expectNotAssignable<string | bigint>(result.another_max)
  expectAssignable<number | null>(result.nullable_max)
  expectNotAssignable<string | bigint>(result.nullable_max)
  expectAssignable<string | number | bigint>(result.min)
  expectNotAssignable<null>(result.min)
  expectAssignable<string>(result.another_min)
  expectNotAssignable<number | bigint | null>(result.another_min)
  expectAssignable<string | null>(result.nullable_min)
  expectNotAssignable<number | bigint>(result.nullable_min)
  expectAssignable<string | number | bigint>(result.sum)
  expectNotAssignable<null>(result.sum)
  expectAssignable<number>(result.another_sum)
  expectNotAssignable<string | bigint | null>(result.another_sum)
  expectAssignable<number | null>(result.nullable_sum)
  expectNotAssignable<string | bigint>(result.nullable_sum)
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

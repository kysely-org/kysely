import {
  expectError,
  expectAssignable,
  expectNotAssignable,
  expectType,
} from 'tsd'
import { Generated, Kysely, Selectable, sql } from '..'
import { Database, Pet } from '../shared'

async function testSelectWithoutAs(db: Kysely<Database>) {
  const { avg, count, countAll, max, min, sum } = db.fn

  expectError(
    db.selectFrom('person').select(avg('age')).executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(avg<number>('age'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db.selectFrom('person').select(count('age')).executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(count<number>('age'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db.selectFrom('person').select(countAll()).executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(countAll<number>())
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(countAll('person'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(countAll<number>('person'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db.selectFrom('person').select(max('age')).executeTakeFirstOrThrow(),
  )

  expectError(
    db.selectFrom('person').select(min('age')).executeTakeFirstOrThrow(),
  )

  expectError(
    db.selectFrom('person').select(sum('age')).executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(sum<number>('age'))
      .executeTakeFirstOrThrow(),
  )
}

async function testSelectWithDefaultGenerics(db: Kysely<Database>) {
  const { avg, count, countAll, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(avg('age').as('avg_age'))
    .select(count('age').as('total_people'))
    .select(countAll().as('total_all'))
    .select(countAll('person').as('total_all_people'))
    .select(max('age').as('max_age'))
    .select(min('age').as('min_age'))
    .select(sum('age').as('total_age'))
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectNotAssignable<null>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectNotAssignable<null>(result.total_people)
  expectAssignable<string | number | bigint>(result.total_all)
  expectNotAssignable<null>(result.total_all)
  expectAssignable<string | number | bigint>(result.total_all_people)
  expectNotAssignable<null>(result.total_all_people)
  expectAssignable<number>(result.max_age)
  expectNotAssignable<string | bigint | null>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectNotAssignable<string | bigint | null>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
  expectNotAssignable<null>(result.total_age)
}

async function testSelectExpressionBuilderWithDefaultGenerics(
  db: Kysely<Database>,
) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      eb.fn.avg('age').as('avg_age'),
      eb.fn.count('age').as('total_people'),
      eb.fn.countAll().as('total_all'),
      eb.fn.countAll('person').as('total_all_people'),
      eb.fn.max('age').as('max_age'),
      eb.fn.min('age').as('min_age'),
      eb.fn.sum('age').as('total_age'),
    ])
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectNotAssignable<null>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectNotAssignable<null>(result.total_people)
  expectAssignable<string | number | bigint>(result.total_all)
  expectNotAssignable<null>(result.total_all)
  expectAssignable<string | number | bigint>(result.total_all_people)
  expectNotAssignable<null>(result.total_all_people)
  expectAssignable<number>(result.max_age)
  expectNotAssignable<string | bigint | null>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectNotAssignable<string | bigint | null>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
  expectNotAssignable<null>(result.total_age)
}

async function testSelectExpressionBuilderWithCustomGenerics(
  db: Kysely<Database>,
) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      eb.fn.avg<number>('age').as('avg_age'),
      eb.fn.count<number>('age').as('total_people'),
      eb.fn.countAll<number>().as('total_all'),
      eb.fn.countAll<number>('person').as('total_all_people'),
      eb.fn.max<number>('age').as('max_age'),
      eb.fn.min<number>('age').as('min_age'),
      eb.fn.sum<number>('age').as('total_age'),
      eb.fn.agg<number>('max', ['age']).as('another_max_age'),
    ])
    .executeTakeFirstOrThrow()

  expectType<number>(result.avg_age)
  expectType<number>(result.total_people)
  expectType<number>(result.total_all)
  expectType<number>(result.total_all_people)
  expectType<number>(result.max_age)
  expectType<number>(result.min_age)
  expectType<number>(result.total_age)
  expectType<number>(result.another_max_age)
}

async function testSelectExpressionBuilderWithSubExpressions(
  db: Kysely<Database>,
) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      eb.fn.avg(eb.ref('age')).as('avg_age'),
      eb.fn.count(eb.ref('age')).as('total_people'),
      eb.fn.countAll().as('total_all'),
      eb.fn.countAll('person').as('total_all_people'),
      eb.fn.max(eb.ref('age').$castTo<bigint>()).as('max_age'),
      eb.fn.min(eb.ref('age')).as('min_age'),
      eb.fn.sum(eb.ref('age')).as('total_age'),
    ])

    .executeTakeFirstOrThrow()

  expectType<string | number>(result.avg_age)
  expectType<string | number | bigint>(result.total_people)
  expectType<string | number | bigint>(result.total_all)
  expectType<string | number | bigint>(result.total_all_people)
  expectType<bigint>(result.max_age)
  expectType<number>(result.min_age)
  expectType<string | number | bigint>(result.total_age)
}

async function testSelectWithCustomGenerics(db: Kysely<Database>) {
  const { avg, count, countAll, max, min, sum, agg } = db.fn

  const result = await db
    .selectFrom('person')
    .select(avg<number>('age').as('avg_age'))
    .select(avg<number | null>('age').as('nullable_avg_age'))
    .select(count<number>('age').as('total_people'))
    .select(countAll<number>().as('total_all'))
    .select(countAll<number>('person').as('total_all_people'))
    .select(max<number | null>('age').as('nullable_max_age'))
    .select(min<number | null>('age').as('nullable_min_age'))
    .select(sum<number>('age').as('total_age'))
    .select(sum<number | null>('age').as('nullable_total_age'))
    .select(agg<number>('max', ['age']).as('max_age'))
    .executeTakeFirstOrThrow()

  expectAssignable<number>(result.avg_age)
  expectNotAssignable<string | bigint | null>(result.avg_age)
  expectAssignable<number | null>(result.nullable_avg_age)
  expectNotAssignable<string | bigint>(result.nullable_avg_age)
  expectAssignable<number>(result.total_people)
  expectNotAssignable<string | bigint | null>(result.total_people)
  expectAssignable<number>(result.total_all)
  expectNotAssignable<string | bigint | null>(result.total_all)
  expectAssignable<number>(result.total_all_people)
  expectNotAssignable<string | bigint | null>(result.total_all_people)
  expectAssignable<number | null>(result.nullable_max_age)
  expectNotAssignable<string | bigint>(result.nullable_max_age)
  expectAssignable<number | null>(result.nullable_min_age)
  expectNotAssignable<string | bigint>(result.nullable_min_age)
  expectAssignable<number>(result.total_age)
  expectNotAssignable<string | bigint | null>(result.total_age)
  expectAssignable<number | null>(result.nullable_total_age)
  expectNotAssignable<string | bigint>(result.nullable_total_age)
  expectType<number>(result.max_age)
}

async function testSelectUnexpectedColumn(db: Kysely<Database>) {
  const { avg, count, countAll, max, min, sum } = db.fn

  expectError(
    db
      .selectFrom('person')
      .select(avg('no_such_column').as('avg_age'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(avg<number>('no_such_column').as('avg_age'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(count('no_such_column').as('total_people'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(count<number>('no_such_column').as('total_people'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(countAll('no_such_table').as('total_all_people'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(countAll<number>('no_such_table').as('total_all_people'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(max('no_such_column').as('max_age'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(min('no_such_column').as('min_age'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(sum('no_such_column').as('total_age'))
      .executeTakeFirstOrThrow(),
  )

  expectError(
    db
      .selectFrom('person')
      .select(sum<number>('no_such_column').as('total_age'))
      .executeTakeFirstOrThrow(),
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
  expectAssignable<number | string | Date | bigint>(result.max)
  expectNotAssignable<null>(result.max)
  expectAssignable<number>(result.another_max)
  expectNotAssignable<string | bigint>(result.another_max)
  expectAssignable<number | null>(result.nullable_max)
  expectNotAssignable<string | bigint>(result.nullable_max)
  expectAssignable<number | string | Date | bigint>(result.min)
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

async function testWithFilterWhere(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  // Column name
  db.selectFrom('person')
    .select(avg('age').filterWhere('gender', '=', 'female').as('avg_age'))
    .select(count('id').filterWhere('gender', '=', 'female').as('female_count'))
    .select(max('age').filterWhere('gender', '=', 'female').as('max_age'))
    .select(min('age').filterWhere('gender', '=', 'female').as('min_age'))
    .select(sum('age').filterWhere('gender', '=', 'female').as('total_age'))

  // Table and column
  db.selectFrom('person').select(
    avg('age').filterWhere('person.gender', '=', 'female').as('avg_age'),
  )

  // Schema, table and column
  db.selectFrom('some_schema.movie').select(
    avg('stars').filterWhere('some_schema.movie.stars', '>', 0).as('avg_stars'),
  )

  // Subquery in LHS
  db.selectFrom('person').select(
    avg('age')
      .filterWhere((qb) => qb.selectFrom('movie').select('stars'), '>', 0)
      .as('avg_age'),
  )

  // Subquery in RHS
  db.selectFrom('movie').select(
    avg('stars')
      .filterWhere(sql<string>`${'female'}`, '=', (qb) =>
        qb.selectFrom('person').select('gender'),
      )
      .as('avg_stars'),
  )

  // Raw expression
  db.selectFrom('person').select(
    avg('age')
      .filterWhere('first_name', '=', sql<string>`'foo'`)
      .filterWhere('first_name', '=', sql<string>`'foo'`)
      .filterWhere(sql`whatever`, '=', 1)
      .filterWhere(sql`whatever`, '=', true)
      .filterWhere(sql`whatever`, '=', '1')
      .as('avg_age'),
  )

  // List value
  db.selectFrom('person').select(
    avg('age').filterWhere('gender', 'in', ['female', 'male']).as('avg_age'),
  )

  // Raw operator
  db.selectFrom('person').select(
    avg('age')
      .filterWhere('person.age', sql`lol`, 25)
      .as('avg_age'),
  )

  // Invalid operator
  expectError(
    db
      .selectFrom('person')
      .select(avg('age').filterWhere('person.age', 'lol', 25).as('avg_age')),
  )

  // Invalid table
  expectError(
    db
      .selectFrom('person')
      .select((eb) =>
        eb.fn.avg('age').filterWhere('movie.stars', '=', 25).as('avg_age'),
      ),
  )

  // Invalid column
  expectError(
    db
      .selectFrom('person')
      .select((eb) =>
        eb.fn.avg('age').filterWhere('stars', '=', 25).as('avg_age'),
      ),
  )

  // Invalid type for column
  expectError(
    db
      .selectFrom('person')
      .select(avg('age').filterWhere('first_name', '=', 25).as('avg_age')),
  )

  // Invalid type for column
  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age').filterWhere('gender', '=', 'not_a_gender').as('avg_age'),
      ),
  )

  // Invalid type for column
  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .filterWhere('gender', 'in', ['female', 'not_a_gender'])
          .as('avg_age'),
      ),
  )

  // Invalid type for column
  expectError(
    db
      .selectFrom('some_schema.movie')
      .select(
        avg('stars')
          .filterWhere('some_schema.movie.id', '=', 1)
          .as('avg_stars'),
      ),
  )

  // Invalid type for column
  expectError(
    db.selectFrom('some_schema.movie').select(
      avg('stars')
        .filterWhere(
          (qb) => qb.selectFrom('person').select('gender'),
          '=',
          'not_a_gender',
        )
        .as('avg_stars'),
    ),
  )

  // Invalid type for column
  expectError(
    db.selectFrom('person').select(
      avg('age')
        .filterWhere('first_name', '=', sql<number>`1`)
        .as('avg_age'),
    ),
  )

  // Invalid type for column
  expectError(
    db.selectFrom('person').select(
      avg('age')
        .filterWhere(sql<string>`first_name`, '=', 1)
        .as('avg_age'),
    ),
  )
}

async function testWithFilterWhereRef(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  // Column name
  db.selectFrom('person')
    .select(
      avg('age').filterWhereRef('first_name', '=', 'last_name').as('avg_age'),
    )
    .select(
      count('id').filterWhereRef('first_name', '=', 'last_name').as('count'),
    )
    .select(
      max('age').filterWhereRef('first_name', '=', 'last_name').as('max_age'),
    )
    .select(
      min('age').filterWhereRef('first_name', '=', 'last_name').as('min_age'),
    )
    .select(
      sum('age').filterWhereRef('first_name', '=', 'last_name').as('total_age'),
    )

  // Table and column
  db.selectFrom('person')
    .select(
      avg('age')
        .filterWhereRef('person.first_name', '=', 'last_name')
        .as('avg_age'),
    )
    .select(
      count('id')
        .filterWhereRef('first_name', '=', 'person.last_name')
        .as('count'),
    )
    .select(
      max('age')
        .filterWhereRef('person.first_name', '=', 'person.last_name')
        .as('max_age'),
    )

  // Schema, table and column
  db.selectFrom('movie')
    .select(
      avg('stars')
        .filterWhereRef('some_schema.movie.id', '=', 'stars')
        .as('avg_stars'),
    )
    .select(
      count('id')
        .filterWhereRef('some_schema.movie.id', '=', 'movie.stars')
        .as('count'),
    )
    .select(
      max('stars')
        .filterWhereRef('some_schema.movie.id', '=', 'some_schema.movie.stars')
        .as('max_stars'),
    )
    .select(
      min('stars')
        .filterWhereRef('movie.id', '=', 'some_schema.movie.stars')
        .as('min_stars'),
    )
    .select(
      sum('stars')
        .filterWhereRef('id', '=', 'some_schema.movie.stars')
        .as('total_stars'),
    )

  // Subquery in LHS
  db.selectFrom('person').select(
    avg('age')
      .filterWhereRef(
        (qb) => qb.selectFrom('movie').select('stars'),
        '>',
        'age',
      )
      .as('avg_age'),
  )

  // Subquery in RHS
  db.selectFrom('person').select(
    avg('age')
      .filterWhereRef('age', '>', (qb) =>
        qb.selectFrom('movie').select('stars'),
      )
      .as('avg_age'),
  )

  // Raw operator
  db.selectFrom('person').select(
    avg('age')
      .filterWhereRef('first_name', sql`lol`, 'last_name')
      .as('avg_age'),
  )

  // Invalid operator
  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .filterWhereRef('first_name', 'lol', 'last_name')
          .as('avg_age'),
      ),
  )

  // Invalid table LHS
  expectError(
    db
      .selectFrom('person')
      .select((eb) =>
        eb.fn
          .avg('age')
          .filterWhereRef('movie.stars', '>', 'age')
          .as('avg_age'),
      ),
  )

  // Invalid table RHS
  expectError(
    db
      .selectFrom('person')
      .select((eb) =>
        eb.fn
          .avg('age')
          .filterWhereRef('age', '>', 'movie.stars')
          .as('avg_age'),
      ),
  )

  // Invalid column LHS
  expectError(
    db
      .selectFrom('person')
      .select((eb) =>
        eb.fn.avg('age').filterWhereRef('stars', '>', 'age').as('avg_age'),
      ),
  )

  // Invalid column RHS
  expectError(
    db
      .selectFrom('person')
      .select((eb) =>
        eb.fn.avg('age').filterWhereRef('age', '>', 'stars').as('avg_age'),
      ),
  )
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
        .as('avg_age'),
    )
    .select(
      count('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('total_people'),
    )
    .select(
      max('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('max_age'),
    )
    .select(
      min('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('min_age'),
    )
    .select(
      sum('age')
        .over((ob) => ob.partitionBy('gender'))
        .as('total_age'),
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
        .as('avg_age'),
    )
    .select(
      count('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name'),
        )
        .as('total_people'),
    )
    .select(
      max('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name'),
        )
        .as('max_age'),
    )
    .select(
      min('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name'),
        )
        .as('min_age'),
    )
    .select(
      sum('age')
        .over((ob) =>
          ob.partitionBy(['gender']).partitionBy('person.first_name'),
        )
        .as('total_age'),
    )
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOverAndPartitionByUnexpectedColumns(
  db: Kysely<Database>,
) {
  const { avg, count, max, min, sum } = db.fn

  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        count('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        count('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        max('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        max('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        min('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        min('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        sum('age')
          .over((ob) => ob.partitionBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        sum('age')
          .over((ob) => ob.partitionBy(['no_such_column']))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
}

async function testSelectWithOverAndOrderBySingle(db: Kysely<Database>) {
  const { avg, count, max, min, sum } = db.fn

  const result = await db
    .selectFrom('person')
    .select(
      avg('age')
        .over((ob) => ob.orderBy('gender'))
        .as('avg_age'),
    )
    .select(
      count('age')
        .over((ob) => ob.orderBy('gender'))
        .as('total_people'),
    )
    .select(
      max('age')
        .over((ob) => ob.orderBy('gender'))
        .as('max_age'),
    )
    .select(
      min('age')
        .over((ob) => ob.orderBy('gender'))
        .as('min_age'),
    )
    .select(
      sum('age')
        .over((ob) => ob.orderBy('gender'))
        .as('total_age'),
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
        .as('avg_age'),
    )
    .select(
      count('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('total_people'),
    )
    .select(
      max('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('max_age'),
    )
    .select(
      min('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('min_age'),
    )
    .select(
      sum('age')
        .over((ob) => ob.orderBy('gender').orderBy('first_name', 'desc'))
        .as('total_age'),
    )
    .executeTakeFirstOrThrow()

  expectAssignable<string | number>(result.avg_age)
  expectAssignable<string | number | bigint>(result.total_people)
  expectAssignable<number>(result.max_age)
  expectAssignable<number>(result.min_age)
  expectAssignable<string | number | bigint>(result.total_age)
}

async function testSelectWithOverAndOrderByUnexpectedColumns(
  db: Kysely<Database>,
) {
  const { avg, count, max, min, sum } = db.fn

  expectError(
    db
      .selectFrom('person')
      .select(
        avg('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        count('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        max('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        min('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
  expectError(
    db
      .selectFrom('person')
      .select(
        sum('age')
          .over((ob) => ob.orderBy('no_such_column'))
          .as('avg_age'),
      )
      .executeTakeFirst(),
  )
}

async function testSelectAsCustomFunctionArgument(db: Kysely<Database>) {
  await db
    .selectFrom('person')
    .select(({ fn }) => [
      fn('round', [fn.avg('age')]).as('avg_age'),
      fn('round', [fn.count('age')]).as('total_people'),
      fn('round', [fn.countAll()]).as('total_all_people'),
      fn('round', [fn.max('age')]).as('max_age'),
      fn('round', [fn.min('age')]).as('min_age'),
      fn('round', [fn.sum('age')]).as('total_age'),
    ])
    .executeTakeFirstOrThrow()

  expectError(
    await db
      .selectFrom('person')
      .select(({ fn }) => [
        fn('round', [fn.avg('NO_SUCH_COLUMN')]).as('avg_age'),
      ])
      .executeTakeFirstOrThrow(),
  )

  expectError(
    await db
      .selectFrom('person')
      .select(({ fn }) => [
        fn('round', [fn.count('NO_SUCH_COLUMN')]).as('avg_age'),
      ])
      .executeTakeFirstOrThrow(),
  )

  expectError(
    await db
      .selectFrom('person')
      .select(({ fn }) => [
        fn('round', [fn.max('NO_SUCH_COLUMN')]).as('avg_age'),
      ])
      .executeTakeFirstOrThrow(),
  )

  expectError(
    await db
      .selectFrom('person')
      .select(({ fn }) => [
        fn('round', [fn.min('NO_SUCH_COLUMN')]).as('avg_age'),
      ])
      .executeTakeFirstOrThrow(),
  )

  expectError(
    await db
      .selectFrom('person')
      .select(({ fn }) => [
        fn('round', [fn.sum('NO_SUCH_COLUMN')]).as('avg_age'),
      ])
      .executeTakeFirstOrThrow(),
  )
}

interface DB764 {
  order: Order764
  orderDetails: OrderDetails764
}

interface OrderDetails764 {
  id: Generated<string>
  orderId: string
  itemName: string
  itemType: string
  quantity: number
  unlimited: true
}

interface Order764 {
  id: Generated<string>
}

enum ItemType764 {
  FOOD = 'FOOD',
  FEELING = 'FEELING',
}

// https://github.com/kysely-org/kysely/issues/764
async function testIssue764(db: Kysely<DB764>) {
  await db
    .with('OrderAggregates', (db) =>
      db
        .selectFrom('orderDetails')
        .innerJoin('order', 'order.id', 'orderDetails.orderId')
        .select([
          'orderDetails.itemName',
          'orderDetails.itemType',
          'order.id as order_id',
          (eb) => eb.fn.max('orderDetails.quantity').as('MaxQuantity'),
          (eb) => eb.fn.sum('orderDetails.quantity').as('SumQuantity'),
          (eb) =>
            eb
              .fn('bool_or', [eb.ref('orderDetails.unlimited')])
              .as('AnyUnlimited'),
        ])
        .groupBy(['order_id']),
    )
    .selectFrom('OrderAggregates')
    .select(['order_id', 'OrderAggregates.itemName'])
    .select((eb) =>
      eb
        .case()
        .when('OrderAggregates.itemType', '=', ItemType764.FOOD)
        .then(
          eb
            .case()
            .when(sql<boolean>`bool_or(${eb.ref('AnyUnlimited')})`)
            .then(-1)
            .else(eb.fn.max('SumQuantity'))
            .end(),
        )
        .when('OrderAggregates.itemType', '=', ItemType764.FEELING)
        .then(eb.fn.max('MaxQuantity'))
        .else(0)
        .end()
        .as('totalQuantity'),
    )
    .groupBy([
      'OrderAggregates.itemName',
      'OrderAggregates.AnyUnlimited',
      'OrderAggregates.MaxQuantity',
      'OrderAggregates.SumQuantity',
    ])
    .execute()
}

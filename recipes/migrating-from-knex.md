# Knex to Kysely migration guide <!-- omit in toc -->

This guide aims to make the average developer's journey from Knex to Kysely easier.
Every Knex example block is followed by a similar Kysely example block.

This guide is arranged like Knex's documentation as of 09.16.2022.
 
# Table of Contents <!-- omit in toc -->

- [1. Query Builder](#1-query-builder)
  - [1.1. Common](#11-common)
    - [1.1.1. knex](#111-knex)
    - [1.1.2. select](#112-select)
    - [1.1.3. as](#113-as)
    - [1.1.4. column](#114-column)
    - [1.1.5. from](#115-from)
    - [1.1.6. fromRaw](#116-fromraw)
    - [1.1.7. with](#117-with)
    - [1.1.8. withRecursive](#118-withrecursive)
    - [1.1.9. withMaterialized](#119-withmaterialized)
    - [1.1.10. withNotMaterialized](#1110-withnotmaterialized)
    - [1.1.11. withSchema](#1111-withschema)
    - [1.1.12. jsonExtract](#1112-jsonextract)
    - [1.1.13. jsonSet](#1113-jsonset)
    - [1.1.14. jsonInsert](#1114-jsoninsert)
    - [1.1.15. jsonRemove](#1115-jsonremove)
    - [1.1.16. offset](#1116-offset)
    - [1.1.17. limit](#1117-limit)
    - [1.1.18. union](#1118-union)
    - [1.1.19. unionAll](#1119-unionall)
    - [1.1.20. intersect](#1120-intersect)
    - [1.1.21. insert](#1121-insert)
    - [1.1.22. onConflict](#1122-onconflict)
    - [1.1.23. upsert](#1123-upsert)
    - [1.1.24. update](#1124-update)
    - [1.1.25. del / delete](#1125-del--delete)
    - [1.1.26. using](#1126-using)
    - [1.1.27. returning](#1127-returning)
    - [1.1.28. transacting](#1128-transacting)
    - [1.1.29. skipLocked](#1129-skiplocked)
    - [1.1.30. noWait](#1130-nowait)
    - [1.1.31. count](#1131-count)
    - [1.1.32. min](#1132-min)
    - [1.1.33. max](#1133-max)
    - [1.1.34. sum](#1134-sum)
    - [1.1.35. avg](#1135-avg)
    - [1.1.36. increment](#1136-increment)
    - [1.1.37. decrement](#1137-decrement)
    - [1.1.38. truncate](#1138-truncate)
    - [1.1.39. pluck](#1139-pluck)
    - [1.1.40. first](#1140-first)
    - [1.1.41. hintComment](#1141-hintcomment)
    - [1.1.42. clone](#1142-clone)
    - [1.1.43. denseRank](#1143-denserank)
    - [1.1.44. rank](#1144-rank)
    - [1.1.45. rowNumber](#1145-rownumber)
    - [1.1.46. partitionBy](#1146-partitionby)
    - [1.1.47. modify](#1147-modify)
    - [1.1.48. columnInfo](#1148-columninfo)
    - [1.1.49. debug](#1149-debug)
    - [1.1.50. connection](#1150-connection)
    - [1.1.51. options](#1151-options)
    - [1.1.52. queryContext](#1152-querycontext)
  - [1.2. Where Clauses](#12-where-clauses)
    - [1.2.1. where](#121-where)
    - [1.2.2. whereNot](#122-wherenot)
    - [1.2.3. whereIn](#123-wherein)
    - [1.2.4. whereNotIn](#124-wherenotin)
    - [1.2.5. whereNull](#125-wherenull)
    - [1.2.6. whereNotNull](#126-wherenotnull)
    - [1.2.7. whereExists](#127-whereexists)
    - [1.2.8. whereNotExists](#128-wherenotexists)
    - [1.2.9. whereBetween](#129-wherebetween)
    - [1.2.10. whereNotBetween](#1210-wherenotbetween)
    - [1.2.11. whereRaw](#1211-whereraw)
    - [1.2.12. whereLike](#1212-wherelike)
    - [1.2.13. whereILike](#1213-whereilike)
    - [1.2.14. whereJsonObject](#1214-wherejsonobject)
    - [1.2.15. whereJsonPath](#1215-wherejsonpath)
    - [1.2.16. whereJsonSupersetOf](#1216-wherejsonsupersetof)
    - [1.2.17. whereJsonSubsetOf](#1217-wherejsonsubsetof)
  - [1.3. Join Methods](#13-join-methods)
    - [1.3.1. join](#131-join)
    - [1.3.2. innerJoin](#132-innerjoin)
    - [1.3.3. leftJoin](#133-leftjoin)
    - [1.3.4. leftOuterJoin](#134-leftouterjoin)
    - [1.3.5. rightJoin](#135-rightjoin)
    - [1.3.6. rightOuterJoin](#136-rightouterjoin)
    - [1.3.7. fullOuterJoin](#137-fullouterjoin)
    - [1.3.8. crossJoin](#138-crossjoin)
    - [1.3.9. joinRaw](#139-joinraw)
  - [1.4. OnClauses](#14-onclauses)
    - [1.4.1. onIn](#141-onin)
    - [1.4.2. onNotIn](#142-onnotin)
    - [1.4.3. onNull](#143-onnull)
    - [1.4.4. onNotNull](#144-onnotnull)
    - [1.4.5. onExists](#145-onexists)
    - [1.4.6. onNotExists](#146-onnotexists)
    - [1.4.7. onBetween](#147-onbetween)
    - [1.4.8. onNotBetween](#148-onnotbetween)
    - [1.4.9. onJsonPathEquals](#149-onjsonpathequals)
  - [1.5. ClearClauses](#15-clearclauses)
    - [1.5.1. clear, clearSelect, clearWhere, clearGroup, clearOrder, clearHaving, clearCounters](#151-clear-clearselect-clearwhere-cleargroup-clearorder-clearhaving-clearcounters)
    - [1.5.2. distinct](#152-distinct)
    - [1.5.3. distinctOn](#153-distincton)
    - [1.5.4. groupBy](#154-groupby)
    - [1.5.5. groupByRaw](#155-groupbyraw)
    - [1.5.6. orderBy](#156-orderby)
    - [1.5.7. orderByRaw](#157-orderbyraw)
  - [1.6. Having Clauses](#16-having-clauses)
    - [1.6.1. having](#161-having)
    - [1.6.2. havingIn](#162-havingin)
    - [1.6.3. havingNotIn](#163-havingnotin)
    - [1.6.4. havingNull](#164-havingnull)
    - [1.6.5. havingNotNull](#165-havingnotnull)
    - [1.6.6. havingExists](#166-havingexists)
    - [1.6.7. havingNotExists](#167-havingnotexists)
    - [1.6.8. havingBetween](#168-havingbetween)
    - [1.6.9. havingNotBetween](#169-havingnotbetween)
    - [1.6.10. havingRaw](#1610-havingraw)
- [2. Transactions](#2-transactions)
- [3. Schema Builder](#3-schema-builder)
- [4. Raw](#4-raw)
- [5. Ref](#5-ref)
- [6. Utility](#6-utility)
- [7. Interfaces](#7-interfaces)
- [8. Migrations](#8-migrations)

# 1. Query Builder

## 1.1. Common

### 1.1.1. knex

knex

```ts
interface User {
  id: number
}

// instantiate knex...

const user = await knex<User>('users').where('id', 1).first()
```

kysely

```ts
interface Database {
  users: {
    id: number
  }
}

const kysely = new Kysely<Database>({ /*...*/ })

const user = await kysely
  .selectFrom('users')
  .where('id', '=', 1)
  .selectAll()
  .executeTakeFirst()
```
---

knex

```ts
interface User {
  id: number
  age: number
}

// instantiate knex...

const users0 = await knex<User>('users').select('id')

const users1 = await knex<User>('users').select('id').select('age')

const usersQueryBuilder = knex<User, { id: number; age?: number }>(
  'users'
).select('id')

if (someCondition) {
  usersQueryBuilder.select('age')
}

const users2 = await usersQueryBuilder
```

kysely

```ts
interface Database {
  users: {
    id: number
    age: number
  }
}

const kysely = new Kysely<Database>({ /*...*/ })

const users0 = await kysely.selectFrom('users').select('id').execute()

const users1 = await kysely
  .selectFrom('users')
  .select('id')
  .select('age')
  .execute()

const users2 = await kysely
  .selectFrom('users')
  .select('id')
  .if(someCondition, (qb) => qb.select('age'))
  .execute()
```

---

knex

```ts
const books0 = await knex.select().from('books').timeout(1000)

const books1 = await knex.select().from('books').timeout(1000, {
  cancel: true,
})
```

kysely - not built-in

```ts
interface Database {
  books: {}
}

const kysely = new Kysely<Database>({ /*...*/ })

const books0 = await withTimeout(kysely.selectFrom('books').selectAll(), 1000)

async function withTimeout<O, DB, TB extends keyof DB>(
  qb: SelectQueryBuilder<DB, TB, O>,
  timeout: number
): Promise<O[]> {
  const rows = await Promise.race([
    qb.execute(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timed out')), timeout)
    ),
  ])

  return rows as O[]
}

const books1 = NOT_SUPPORTED
```

---

### 1.1.2. select

knex

```ts
const books0 = await knex.select('title', 'author', 'year').from('books')

const books1 = await knex.select().table('books')
```

kysely

```ts
interface Database {
  books: {
    title: string
    author: string
    year: string
  }
}

const kysely = new Kysely<Database>({ /*...*/ })

const books0 = await kysely
  .selectFrom('books')
  .select(['title', 'author', 'year'])
  .execute()

const books1 = await kysely.selectFrom('books').selectAll().execute()
```

---

knex

```ts
const users0 = await knex.select('id').from<User>('users')

const users1 = await knex
  .select(knex.ref('id').withSchema('users'))
  .from<User>('users')

const users2 = await knex
  .select(knex.ref('id').as('identifier'))
  .from<User>('users')
```

kysely

```ts
interface Database {
  users: {
    id: number
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const users0 = await kysely.selectFrom('users').select('id').execute()

const users1 = await kysely.selectFrom('users').select('users.id').execute()

const users2 = await kysely
  .selectFrom('users')
  .select('id as identifier')
  .execute()
```

---

### 1.1.3. as

knex

```ts
const results = await knex
  .avg('sum_column1')
  .from(function () {
    this.sum('column1 as sum_column1').from('t1').groupBy('column1').as('t1')
  })
  .as('ignored_alias')
```

kysely

```ts
interface Database {
  t1: {
    column1: number
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const results = await kysely
  .selectFrom((qb) =>
    qb
      .selectFrom('t1')
      .select(qb.fn.sum('column1').as('sum_column1'))
      .groupBy('column1')
      .as('t1')
  )
  .select((qb) => qb.fn.avg('sum_column1').as('mandatory_alias'))
  .execute()
```

### 1.1.4. column

knex

```ts
const books0 = await knex
  .column('title', 'author', 'year')
  .select()
  .from('books')

const books1 = await knex
  .column(['title', 'author', 'year'])
  .select()
  .from('books')

const books2 = await knex
  .column('title', { by: 'author' }, 'year')
  .select()
  .from('books')
```

kysely

```ts
interface Database {
  books: {
    title: string
    author: string
    year: string
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const books0 = await kysely
  .selectFrom('books')
  .select(['title', 'author', 'year'])
  .execute()

const books1 = books0

const books2 = await kysely
  .selectFrom('books')
  .select(['title', 'author as by', 'year'])
  .execute()
```

### 1.1.5. from

knex

```ts
const users = await knex.select('*').from('users')
```

kysely

```ts
interface Database {
  users: {}
}

const kysely = new Kysely<Database>({ /* ... */ })

const users = await kysely.selectFrom('users').selectAll().execute()
```

---

knex

```ts
const users = await knex.select('id').from<User>('users')
```

kysely

```ts
interface Database {
  users: {
    id: number
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const users = await kysely.selectFrom('users').select('id').execute()
```

### 1.1.6. fromRaw

knex

```ts
const users = await knex
  .select('*')
  .fromRaw('(select * from "users" where "age" > ?)', '18')
```

kysely

```ts
import { sql } from 'kysely'

interface Database {
  users: {
    age: string
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const users = await kysely
  .selectFrom(
    sql<Database['users'][]>`select * from ${sql.table('users')} where ${sql.ref(
      'age'
    )} > ${'18'}`.as('mandatory_alias')
  )
  .selectAll()
  .execute()
```

### 1.1.7. with

knex

```ts
const books0 = await knex
  .with(
    'with_alias',
    knex.raw('select * from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias')

const books1 = await knex
  .with(
    'with_alias',
    ['title'],
    knex.raw('select "title" from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias')

const books2 = await knex
  .with('with_alias', (qb) => {
    qb.select('*').from('books').where('author', 'Test')
  })
  .select('*')
  .from('with_alias')
```

kysely

```ts
import { sql } from 'kysely'

interface Database {
  books: {
    title: string
    author: string
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const books0 = await kysely
  .with(
    'with_alias',
    () =>
      sql<Database['books'][]>`select * from ${sql.table('books')} where ${sql.ref(
        'author'
      )} = ${'Test'}`
  )
  .selectFrom('with_alias')
  .selectAll()
  .execute()

const books1 = await kysely
  .with(
    'with_alias',
    () =>
      sql<Pick<Database['books'], 'title'>[]>`select ${sql.ref('title')} from ${sql.table('books')} where ${sql.ref(
        'author'
      )} = ${'Test'}`
  )
  .selectFrom('with_alias')
  .selectAll()
  .execute()

const books2 = await kysely
  .with('with_alias', (qb) =>
    qb.selectFrom('books').where('author', '=', 'Test').selectAll()
  )
  .selectFrom('with_alias')
  .selectAll()
  .execute()
```

### 1.1.8. withRecursive

knex

```ts
const ancestors = await knex
  .withRecursive('ancestors', (qb) => {
    qb.select('*')
      .from('people')
      .where('people.id', 1)
      .union((qb) => {
        qb.select('*')
          .from('people')
          .join('ancestors', 'ancestors.parentId', 'people.id')
      })
  })
  .select('*')
  .from('ancestors')

const family = await knex
  .withRecursive('family', ['name', 'parentName'], (qb) => {
    qb.select('name', 'parentName')
      .from('folks')
      .where({ name: 'grandchild' })
      .unionAll((qb) =>
        qb
          .select('folks.name', 'folks.parentName')
          .from('folks')
          .join('family', knex.ref('family.parentName'), knex.ref('folks.name'))
      )
  })
  .select('name')
  .from('family')
```

kysely

```ts
interface Database {
  people: {
    id: number
    parentId: number | null
  }
  folks: {
    name: string
    parentName: string
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const ancestors = await kysely
  .withRecursive('ancestors', (qb) =>
    qb
      .selectFrom('people')
      .where('people.id', '=', 1)
      .selectAll()
      .union(
        qb
          .selectFrom('people')
          .innerJoin('ancestors', 'ancestors.parentId', 'people.id')
          .selectAll('people')
      )
  )
  .selectFrom('ancestors')
  .selectAll()
  .execute()

const family = await kysely
  .withRecursive('family(name, parentName)', (qb) =>
    qb
      .selectFrom('folks')
      .where('name', '=', 'grandchild')
      .select(['name', 'parentName'])
      .unionAll(
        qb
          .selectFrom('folks')
          .innerJoin('family', 'family.parentName', 'folks.name')
          .select(['folks.name', 'folks.parentName'])
      )
  )
  .selectFrom('family')
  .select('name')
  .execute()
```

### 1.1.9. withMaterialized

knex

```ts
const books0 = await knex
  .withMaterialized(
    'with_alias',
    knex.raw('select * from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias')

const books1 = await knex
  .withMaterialized(
    'with_alias',
    ['title'],
    knex.raw('select "title" from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias')

const books2 = await knex
  .withMaterialized('with_alias', (qb) => {
    qb.select('*').from('books').where('author', 'Test')
  })
  .select('*')
  .from('with_alias')
```

kysely - not built-in

```ts
interface Database {
  books: {
    title: string
    author: string
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const { rows: books0 } = await sql<Database['books'][]>`with ${sql.table(
  'with_alias'
)} as materialized (
  select * from ${sql.table('books')} where ${sql.ref('author')} = ${'Test'}
)
select * from ${sql.table('with_alias')}`.execute(kysely)

const { rows: books1 } = await sql<Database['books'][]>`with ${sql.table('with_alias')}(${sql.ref(
  'title'
)}) as materialized (
  select ${sql.ref('title')} from ${sql.table('books')} where ${sql.ref(
  'author'
)} = ${'Test'}
)
select * from ${sql.table('with_alias')}`.execute(kysely)

const books2 = books0
```

### 1.1.10. withNotMaterialized

knex

```ts
const books0 = await knex
  .withNotMaterialized(
    'with_alias',
    knex.raw('select * from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias')

const books1 = await knex
  .withNotMaterialized(
    'with_alias',
    ['title'],
    knex.raw('select "title" from "books" where "author" = ?', 'Test')
  )
  .select('*')
  .from('with_alias')

const books2 = await knex
  .withNotMaterialized('with_alias', (qb) => {
    qb.select('*').from('books').where('author', 'Test')
  })
  .select('*')
  .from('with_alias')
```

kysely - not built-in

```ts
interface Database {
  books: {
    title: string
    author: string
  }
}

const kysely = new Kysely<Database>({ /* ... */ })

const { rows: books0 } = await sql<Database['books'][]>`with ${sql.table(
  'with_alias'
)} as not materialized (
  select * from ${sql.table('books')} where ${sql.ref('author')} = ${'Test'}
)
select * from ${sql.table('with_alias')}`.execute(kysely)

const { rows: books1 } = await sql<Database['books'][]>`with ${sql.table(
  'with_alias'
)}(${sql.ref('title')}) as not materialized (
  select ${sql.ref('title')} from ${sql.table('books')} where ${sql.ref(
  'author'
)} = ${'Test'}
)
select * from ${sql.table('with_alias')}`.execute(kysely)

const books2 = books0
```

### 1.1.11. withSchema

TODO: ...

### 1.1.12. jsonExtract

TODO: ...

### 1.1.13. jsonSet

TODO: ...

### 1.1.14. jsonInsert

TODO: ...

### 1.1.15. jsonRemove

TODO: ...

### 1.1.16. offset

TODO: ...

### 1.1.17. limit

TODO: ...

### 1.1.18. union

TODO: ...

### 1.1.19. unionAll

TODO: ...

### 1.1.20. intersect

TODO: ...

### 1.1.21. insert

TODO: ...

### 1.1.22. onConflict

TODO: ...

### 1.1.23. upsert

TODO: ...

### 1.1.24. update

TODO: ...

### 1.1.25. del / delete

TODO: ...

### 1.1.26. using

TODO: ...

### 1.1.27. returning

TODO: ...

### 1.1.28. transacting

TODO: ...

### 1.1.29. skipLocked

TODO: ...

### 1.1.30. noWait

TODO: ...

### 1.1.31. count

TODO: ...

### 1.1.32. min

TODO: ...

### 1.1.33. max

TODO: ...

### 1.1.34. sum

TODO: ...

### 1.1.35. avg

TODO: ...

### 1.1.36. increment

TODO: ...

### 1.1.37. decrement

TODO: ...

### 1.1.38. truncate

TODO: ...

### 1.1.39. pluck

TODO: ...

### 1.1.40. first

TODO: ...

### 1.1.41. hintComment

TODO: ...

### 1.1.42. clone

TODO: ...

### 1.1.43. denseRank

TODO: ...

### 1.1.44. rank

TODO: ...

### 1.1.45. rowNumber

TODO: ...

### 1.1.46. partitionBy

TODO: ...

### 1.1.47. modify

TODO: ...

### 1.1.48. columnInfo

TODO: ...

### 1.1.49. debug

TODO: ...

### 1.1.50. connection

TODO: ...

### 1.1.51. options

TODO: ...

### 1.1.52. queryContext

TODO: ...

## 1.2. Where Clauses

### 1.2.1. where

TODO: ...

### 1.2.2. whereNot

TODO: ...

### 1.2.3. whereIn

TODO: ...

### 1.2.4. whereNotIn

TODO: ...

### 1.2.5. whereNull

TODO: ...

### 1.2.6. whereNotNull

TODO: ...

### 1.2.7. whereExists

TODO: ...

### 1.2.8. whereNotExists

TODO: ...

### 1.2.9. whereBetween

TODO: ...

### 1.2.10. whereNotBetween

TODO: ...

### 1.2.11. whereRaw

TODO: ...

### 1.2.12. whereLike

TODO: ...

### 1.2.13. whereILike

TODO: ...

### 1.2.14. whereJsonObject

TODO: ...

### 1.2.15. whereJsonPath

TODO: ...

### 1.2.16. whereJsonSupersetOf

TODO: ...

### 1.2.17. whereJsonSubsetOf

TODO: ...

## 1.3. Join Methods

### 1.3.1. join

TODO: ...

### 1.3.2. innerJoin

TODO: ...

### 1.3.3. leftJoin

TODO: ...

### 1.3.4. leftOuterJoin

TODO: ...

### 1.3.5. rightJoin

TODO: ...

### 1.3.6. rightOuterJoin

TODO: ...

### 1.3.7. fullOuterJoin

TODO: ...

### 1.3.8. crossJoin

TODO: ...

### 1.3.9. joinRaw

TODO: ...

## 1.4. OnClauses

### 1.4.1. onIn

TODO: ...

### 1.4.2. onNotIn

TODO: ...

### 1.4.3. onNull

TODO: ...

### 1.4.4. onNotNull

TODO: ...

### 1.4.5. onExists

TODO: ...

### 1.4.6. onNotExists

TODO: ...

### 1.4.7. onBetween

TODO: ...

### 1.4.8. onNotBetween

TODO: ...

### 1.4.9. onJsonPathEquals

TODO: ...

## 1.5. ClearClauses

### 1.5.1. clear, clearSelect, clearWhere, clearGroup, clearOrder, clearHaving, clearCounters

NOT SUPPORTED

### 1.5.2. distinct

TODO: ...

### 1.5.3. distinctOn

TODO: ...

### 1.5.4. groupBy

TODO: ...

### 1.5.5. groupByRaw

TODO: ...

### 1.5.6. orderBy

TODO: ...

### 1.5.7. orderByRaw

TODO: ...

## 1.6. Having Clauses

### 1.6.1. having

TODO: ...

### 1.6.2. havingIn

TODO: ...

### 1.6.3. havingNotIn

TODO: ...

### 1.6.4. havingNull

TODO: ...

### 1.6.5. havingNotNull

TODO: ...

### 1.6.6. havingExists

TODO: ...

### 1.6.7. havingNotExists

TODO: ...

### 1.6.8. havingBetween

TODO: ...

### 1.6.9. havingNotBetween

TODO: ...

### 1.6.10. havingRaw

TODO: ...

# 2. Transactions

TODO: ...

# 3. Schema Builder

TODO: ...

# 4. Raw

TODO: ...

# 5. Ref

TODO: ...

# 6. Utility

TODO: ...

# 7. Interfaces

TODO: ...

# 8. Migrations

TODO: ...
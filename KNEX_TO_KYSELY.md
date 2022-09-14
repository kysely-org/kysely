# Query Builder

## Common

### knex

knex

```ts
interface User {
  id: number;
  name: string;
  age: number;
}

// instantiate knex...

const user = await knex<User>('users').where('id', 1).first();
```

kysely

```ts
interface Database {
    users: {
        id: number;
        name: string;
        age: number;
    };
}

const kysely = new Kysely<Database>(...);

const user = await kysely.selectFrom('users')
    .where('id', '=', 1)
    .selectAll()
    .executeTakeFirst();
```
---

knex

```ts
const users0 = await knex<User>('users').select('id');

const users1 = await knex<User>('users').select('id').select('age');

const usersQueryBuilder = knex<User, { id: number; age?: string; }>('users').select('id');

if (someCondition) {
  usersQueryBuilder.select('age');
}

const users2 = await usersQueryBuilder;
```

kysely

```ts
const users0 = await kysely.selectFrom('users').select('id').execute();

const users1 = await kysely.selectFrom('users')
    .select('id')
    .select('age')
    .execute();

const users2 = await kysely.selectFrom('users')
    .select('id')
    .if(someCondition, (qb) => qb.select('age'))
    .execute();
```

---

knex

```ts
const books0 = await knex.select().from('books').timeout(1000)

const books1 = await knex.select().from('books').timeout(1000, {
    cancel: true
})
```

kysely - not built-in

```ts
const books0 = await withTimeout(kysely.selectFrom('books').selectAll(), 1000)

async function withTimeout<O, DB, TB extends keyof DB>(
    qb: SelectQueryBuilder<DB, TB, O>, 
    timeout: number
): Promise<O[]> {
    const [rows] = await Promise.race([
        qb.execute(),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timed out')), timeout)
        ),
    ]);

    return rows;
}

// books1 impossible
```

---

### select

knex

```ts
const books0 = await knex.select('title', 'author', 'year').from('books')

const books1 = await knex.select().table('books')
```

kysely

```ts
const books0 = await kysely.selectFrom('books')
    .select(['title', 'author', 'year'])
    .execute()

const books1 = await kysely.selectFrom('books').selectAll().execute()
```

---

knex

```ts
const users0 = await knex.select('id').from<User>('users');

const users1 = await knex.select(
    knex.ref('id').withSchema('users')
).from<User>('users');

const users2 = await knex.select(
    knex.ref('id').as('identifier')
).from<User>('users');
```

kysely

```ts
const users0 = await kysely.selectFrom('users').select('id').execute();

const users1 = await kysely.selectFrom('users').select('users.id').execute();

const users2 = await kysely.selectFrom('users')
    .select('id as identifier')
    .execute();
```

---

### as

knex

```ts
const results = await knex.avg('sum_column1').from(function() {
    this.sum('column1 as sum_column1')
        .from('t1')
        .groupBy('column1')
        .as('t1')
}).as('ignored_alias')
```

kysely

```ts
const results = await kysely.selectFrom(
    (qb) => qb.selectFrom('t1')
        .select(qb.fn.sum('column1').as('sum_column1'))
        .groupBy('column1')
        .as('t1')
).select((qb) => qb.fn.avg('sum_column1').as('mandatory_alias'))
```

### column

knex

```ts
const books0 = await knex.column('title', 'author', 'year').select().from('books')

const books1 = await knex.column(['title', 'author', 'year']).select().from('books')

const books2 = await knex.column('title', { by: 'author' }, 'year')
    .select()
    .from('books')
```

kysely

```ts
const books0 = await kysely.selectFrom('books')
    .select(['title', 'author', 'year'])
    .execute()

const books1 = books0

const books2 = await kysely.selectFrom('books')
    .select(['title', 'author as by', 'year'])
    .execute()
```

### from

knex

```ts
const users = await knex.select('*').from('users')
```

kysely

```ts
const users = await kysely.selectFrom('users').selectAll().execute()
```

---

knex

```ts
const users = await knex.select('id').from<User>('users');
```

kysely

```ts
const users = await kysely.selectFrom('users').select('id').execute();
```

### fromRaw

knex

```ts
const users = await knex.select('*')
    .fromRaw('(select * from "users" where "age" > ?)', '18')
```

kysely

```ts
import { sql } from 'kysely'

const users = await kysely.selectFrom(
    sql`select * from ${sql.table('users')} where ${sql.ref('age')} > ${'18'}`.as('mandatory_alias')
)
    .selectAll()
    .execute()
```

### with

knex

```ts
const books0 = await knex.with(
    'with_alias', 
    knex.raw(
        'select * from "books" where "author" = ?',
        'Test'
    )
)
    .select('*')
    .from('with_alias')

const books1 = await knex.with(
    'with_alias',
    ['title'],
    knex.raw(
        'select "title" from "books" where "author" = ?',
        'Test'
    )
)
    .select('*')
    .from('with_alias')

const books2 = await knex.with(
    'with_alias',
    (qb) => {
        qb.select('*').from('books').where('author', 'Test')
    }
)
    .select('*')
    .from('with_alias')
```

kysely

```ts
import { sql } from 'kysely'

const books0 = await kysely.with(
    'with_alias',
    () => sql`select * from ${sql.table('books')} where ${sql.ref('author')} = ${'Test'}`
)
    .selectFrom('with_alias')
    .selectAll()
    .execute()

const books1 = await kysely.with(
    'with_alias',
    () => sql`select ${sql.ref('title')} from ${sql.table('books')} where ${sql.ref('author')} = ${'Test'}`
)
    .selectFrom('with_alias')
    .selectAll()
    .execute()

const books2 = await kysely.with(
    'with_alias',
    (qb) => qb.selectFrom('books').where('author', '=', 'Test').selectAll()
)
    .selectFrom('with_alias')
    .selectAll()
    .execute()
```

### withRecursive

TODO: ...

### withMaterialized

TODO: ...

### withNotMaterialized

TODO: ...

### withSchema

TODO: ...

### jsonExtract

TODO: ...

### jsonSet

TODO: ...

### jsonInsert

TODO: ...

### jsonRemove

TODO: ...

### offset

TODO: ...

### limit

TODO: ...

### union

TODO: ...

### unionAll

TODO: ...

### intersect

TODO: ...

### insert

TODO: ...

### onConflict

TODO: ...

### upsert

TODO: ...

### update

TODO: ...

### del / delete

TODO: ...

### using

TODO: ...

### returning

TODO: ...

### transacting

TODO: ...

### skipLocked

TODO: ...

### noWait

TODO: ...

### count

TODO: ...

### min

TODO: ...

### max

TODO: ...

### sum

TODO: ...

### avg

TODO: ...

### increment

TODO: ...

### decrement

TODO: ...

### truncate

TODO: ...

### pluck

TODO: ...

### first

TODO: ...

### hintComment

TODO: ...

### clone

TODO: ...

### denseRank

TODO: ...

### rank

TODO: ...

### rowNumber

TODO: ...

### partitionBy

TODO: ...

### modify

TODO: ...

### columnInfo

TODO: ...

### debug

TODO: ...

### connection

TODO: ...

### options

TODO: ...

### queryContext

TODO: ...

## Where Clauses

### where

TODO: ...

### whereNot

TODO: ...

### whereIn

TODO: ...

### whereNotIn

TODO: ...

### whereNull

TODO: ...

### whereNotNull

TODO: ...

### whereExists

TODO: ...

### whereNotExists

TODO: ...

### whereBetween

TODO: ...

### whereNotBetween

TODO: ...

### whereRaw

TODO: ...

### whereLike

TODO: ...

### whereILike

TODO: ...

### whereJsonObject

TODO: ...

### whereJsonPath

TODO: ...

### whereJsonSupersetOf

TODO: ...

### whereJsonSubsetOf

TODO: ...

## Join Methods

### join

TODO: ...

### innerJoin

TODO: ...

### leftJoin

TODO: ...

### leftOuterJoin

TODO: ...

### rightJoin

TODO: ...

### rightOuterJoin

TODO: ...

### fullOuterJoin

TODO: ...

### crossJoin

TODO: ...

### joinRaw

TODO: ...

## OnClauses

### onIn

TODO: ...

### onNotIn

TODO: ...

### onNull

TODO: ...

### onNotNull

TODO: ...

### onExists

TODO: ...

### onNotExists

TODO: ...

### onBetween

TODO: ...

### onNotBetween

TODO: ...

### onJsonPathEquals

TODO: ...

## ClearClauses

### clear, clearSelect, clearWhere, clearGroup, clearOrder, clearHaving, clearCounters

NOT SUPPORTED

### distinct

TODO: ...

### distinctOn

TODO: ...

### groupBy

TODO: ...

### groupByRaw

TODO: ...

### orderBy

TODO: ...

### orderByRaw

TODO: ...

## Having Clauses

### having

TODO: ...

### havingIn

TODO: ...

### havingNotIn

TODO: ...

### havingNull

TODO: ...

### havingNotNull

TODO: ...

### havingExists

TODO: ...

### havingNotExists

TODO: ...

### havingBetween

TODO: ...

### havingNotBetween

TODO: ...

### havingRaw

TODO: ...

# Transactions

TODO: ...

# Schema Builder

TODO: ...

# Raw

TODO: ...

# Ref

TODO: ...

# Utility

TODO: ...

# Interfaces

TODO: ...

# Migrations

TODO: ...
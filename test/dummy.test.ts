import { Kysely } from '../src'

interface Person {
  id: number
  first_name: string
  last_name: string
  gender: 'male' | 'female' | 'other'
}

interface Pet {
  id: number
  name: string
  owner_id: number
  species: 'dog' | 'cat'
}

interface Movie {
  id: string
  stars: number
}

interface Database {
  person: Person
  pet: Pet
  movie: Movie
  'some_schema.movie': Movie
}

describe.skip('dummy test', () => {
  let db: Kysely<Database>

  beforeEach(async () => {
    db = new Kysely<Database>({
      dialect: 'postgres',
      host: 'localhost',
      database: 'kysely_test',
    })

    await Promise.all(
      (['pet', 'movie', 'person'] as const).map((table) =>
        db.deleteFrom(table).execute()
      )
    )

    const [jennifer, bradley] = await db
      .insertInto('person')
      .values([
        {
          first_name: 'Jennifer',
          last_name: 'Aniston',
          gender: 'female',
        },
        {
          first_name: 'Bradley',
          last_name: 'Cooper',
          gender: 'male',
        },
      ])
      .returning('id')
      .execute()

    await db.insertInto('pet').values([
      {
        owner_id: jennifer.id,
        name: 'Catto',
        species: 'cat',
      },
      {
        owner_id: bradley.id,
        name: 'Doggo',
        species: 'dog',
      },
    ])
  })

  afterEach(async () => {
    await db?.destroy()
  })

  it('simple', async () => {
    const row = await db
      .selectFrom('person')
      .select(['id', 'first_name'])
      .executeTakeFirst()

    if (row) {
      console.log(row.first_name)
    }
  })

  it('selects', async () => {
    const r = await db
      .selectFrom([
        'person',
        'pet as p',
        db.selectFrom('movie as m').select('m.stars as strs').as('muuvi'),
      ])
      .select([
        'first_name',
        'person.last_name as pln',
        'strs',
        'muuvi.strs as movieStarz',
        'person.id',
        'p.name as foo',
        'p.species as faz',
        'p.owner_id as bar',
        'person.id as baz',
        db.raw<boolean>('random() > 0.5').as('rand1'),
        db.raw<boolean>('random() < 0.5').as('rand2'),
        db.selectFrom('movie').select('stars').as('sub1'),
        (qb) => qb.subQuery('movie').select('stars').as('sub2'),
      ])
      .executeTakeFirst()

    if (r) {
      r.first_name
      r.pln
      r.strs
      r.movieStarz
      r.id
      r.foo
      r.faz
      r.bar
      r.baz
      r.rand1
      r.rand2
      r.sub1
      r.sub2
    }
  })

  it('join', async () => {
    const qb1 = db
      .selectFrom('person')
      .innerJoin('movie', 'stars', 'id')
      .selectAll()
    //console.log(qb1.compile(new QueryCompiler()).sql)

    const qb2 = db.selectFrom('person').innerJoin('pet as p', 'owner_id', 'id')

    const qb3 = db
      .selectFrom('person as p')
      .innerJoin(
        (qb) => qb.subQuery('pet as p').select('p.name as n').as('pet'),
        'p.id',
        'pet.n'
      )
      .innerJoin('movie as m', 'stars', 'pet.n')

    const qb4 = db
      .selectFrom('person as per')
      .selectAll('per')
      .innerJoin('pet as p', (join) =>
        join.on('p.owner_id', '=', 'per.id').on('p.owner_id', '=', 'per.id')
      )

    console.log(qb4.compile().sql)
  })

  it('sql', async () => {
    const qb = db
      .selectFrom(['pet', 'person as p'])
      .select('pet.name')
      .distinctOn('p.first_name')
      .whereRef('p.last_name', '=', 'pet.name')
      .where('pet.name', 'in', ['foo', 'bar', 'baz'])
      .whereExists((qb) =>
        qb.subQuery('movie as m').whereRef('m.id', '=', 'p.id').selectAll()
      )

    console.log(qb.compile().sql)
  })

  it('from', async () => {
    db.selectFrom('some_schema.movie').select('some_schema.movie.stars')

    const qb2 = db
      .selectFrom(() => db.selectFrom('movie').selectAll().as('m'))
      .select((qb) =>
        qb
          .subQuery('person')
          .whereRef('m.id', '=', 'person.id')
          .select('first_name')
          .as('f')
      )

    console.log(qb2.compile().sql)
  })

  it('raw', async () => {
    const qb = db.selectFrom('movie').select(() =>
      db
        .raw<number>('what(??, ?) \\?\\? ?', ['foo.bar', 1, 100])
        .as('thing')
    )

    console.log(qb.compile().sql)
  })

  it('simple perf test for building the query', async () => {
    function test() {
      const qb = db
        .selectFrom(['pet', 'person as p'])
        .select('pet.name')
        .distinctOn('p.first_name')
        .whereRef('p.last_name', '=', 'pet.name')
        .where('pet.name', 'in', ['foo', 'bar', 'baz'])
        .whereExists((qb) =>
          qb.subQuery('movie as m').whereRef('m.id', '=', 'p.id').selectAll()
        )

      qb.compile()
    }

    // Warmup.
    for (let i = 0; i < 1000; ++i) {
      test()
    }

    const rounds = 100000
    const t = new Date()
    for (let i = 0; i < rounds; ++i) {
      test()
    }

    console.log((new Date().valueOf() - t.valueOf()) / rounds)
  })

  it('insert', async () => {
    const qb = db.insertInto('person').values({
      last_name: 'Test',
      gender: 'male',
      first_name: db
        .selectFrom('person')
        .where('id', '=', 1)
        .select('first_name'),
    })

    console.log(qb.compile())
    const result = await qb.execute()
    console.log(result)
  })

  it.skip('schema', async () => {
    await db.schema.createTable('person', (table) =>
      table
        .column('id', (col) => col.increments().primary())
        .column('first_name', (col) => col.string())
    )
  })
})

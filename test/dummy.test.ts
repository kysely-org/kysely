import { Kysely } from '../src'

interface Person {
  id: number
  first_name: string
  last_name: string
  age: number
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

describe('dummy test', () => {
  let db: Kysely<Database>

  beforeEach(async () => {
    db = new Kysely<Database>({
      dialect: 'postgres',
      host: 'localhost',
      database: 'kysely_test',
    })
  })

  afterEach(async () => {
    await db?.destroy()
  })

  it('simple', async () => {
    const [{ id, first_name }] = await db
      .query('person')
      .select(['id', 'first_name'])
      .execute()
  })

  it('selects', async () => {
    const [r] = await db
      .query([
        'person',
        'pet as p',
        db.query('movie as m').select('m.stars as strs').as('muuvi'),
      ])
      .select([
        'first_name',
        'person.last_name as pln',
        'strs',
        'muuvi.strs as movieStarz',
        'person.id',
        'person.age',
        'p.name as foo',
        'p.species as faz',
        'p.owner_id as bar',
        'person.id as baz',
        db.raw<boolean>('random() > 0.5').as('rand1'),
        db.raw<boolean>('random() < 0.5').as('rand2'),
        db.query('movie').select('stars').as('sub1'),
        (qb) => qb.subQuery('movie').select('stars').as('sub2'),
      ])
      .execute()

    r.first_name
    r.pln
    r.strs
    r.movieStarz
    r.id
    r.age
    r.foo
    r.faz
    r.bar
    r.baz
    r.rand1
    r.rand2
    r.sub1
    r.sub2
  })

  it('join', async () => {
    const qb1 = db.query('person').innerJoin('movie', 'stars', 'id').selectAll()
    //console.log(qb1.compile(new QueryCompiler()).sql)

    const qb2 = db.query('person').innerJoin('pet as p', 'owner_id', 'id')

    const qb3 = db
      .query('person as p')
      .innerJoin(
        (qb) => qb.subQuery('pet as p').select('p.name as n').as('pet'),
        'p.id',
        'pet.n'
      )
      .innerJoin('movie as m', 'stars', 'pet.n')

    const qb4 = db
      .query('person as per')
      .innerJoin('pet as p', (join) =>
        join.on('p.owner_id', '=', 'per.id').on('p.owner_id', '=', 'per.id')
      )
    console.log(qb4.compile().sql)
  })

  it('sql', async () => {
    const qb = db
      .query(['pet', 'person as p'])
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
    db.query('some_schema.movie').select('some_schema.movie.stars')

    const qb2 = db
      .query(() => db.query('movie').selectAll().as('m'))
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
    const qb = db.query('movie').select(() =>
      db
        .raw<number>('what(??, ?) \\?\\? ?', ['foo.bar', 1, 100])
        .as('thing')
    )

    console.log(qb.compile().sql)
  })

  it('simple perf test for building the query', async () => {
    function test() {
      const qb = db
        .query(['pet', 'person as p'])
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
})

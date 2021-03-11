import { Kysely } from '../src'
import { QueryCompiler } from '../src/query-compiler/query-compiler'

interface Person {
  id: number
  firstName: string
  lastName: string
  age: number
  gender: 'male' | 'female' | 'other'
}

interface Animal {
  id: string
  name: string
  ownerId: number
  species: 'dog' | 'cat'
}

interface Movie {
  id: string
  stars: number
}

interface Database {
  person: Person
  animal: Animal
  movie: Movie
  'someSchema.movie': Movie
}

describe('dummy test', () => {
  let db: Kysely<Database>

  beforeEach(async () => {
    db = new Kysely<Database>()
  })

  it('smple', async () => {
    const [{ id, firstName }] = await db
      .query('person')
      .select(['id', 'firstName'])
      .execute()
  })

  it('selects', async () => {
    const { query } = db

    const [r] = await db
      .query([
        'person',
        'animal as a',
        query('movie as m').select('m.stars as strs').as('muuvi'),
      ])
      .select([
        'firstName',
        'person.lastName as pln',
        'strs',
        'muuvi.strs as movieStarz',
        'person.id',
        'person.age',
        'a.name as foo',
        'a.species as faz',
        'a.ownerId as bar',
        'person.id as baz',
        db.raw<boolean>('random() > 0.5').as('rand1'),
        db.raw<boolean>('random() < 0.5').as('rand2'),
        query('movie').select('stars').as('sub1'),
        (qb) => qb.subQuery('movie').select('stars').as('sub2'),
      ])
      .execute()

    r.firstName
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
    const { query } = db

    const qb1 = query('person').innerJoin('movie', 'stars', 'id').selectAll()
    //console.log(qb1.compile(new QueryCompiler()).sql)

    const qb2 = query('person').innerJoin('animal as a', 'ownerId', 'id')

    const qb3 = db
      .query('person as p')
      .innerJoin(
        (qb) => qb.subQuery('animal as a').select('a.name as n').as('a'),
        'p.id',
        'a.n'
      )
      .innerJoin('movie as m', 'stars', 'a.n')

    const qb4 = db
      .query('person as p')
      .innerJoin('animal as a', (join) =>
        join.on('a.ownerId', '=', 'p.id').on('a.ownerId', '=', 'p.id')
      )
    console.log(qb4.compile(new QueryCompiler()).sql)
  })

  it('sql', async () => {
    const qb = db
      .query(['animal', 'person as p'])
      .select('animal.name')
      .distinctOn('p.firstName')
      .whereRef('p.lastName', '=', 'animal.name')
      .where('animal.name', 'in', ['foo', 'bar', 'baz'])
      .whereExists((qb) =>
        qb.subQuery('movie as m').whereRef('m.id', '=', 'p.id').selectAll()
      )

    console.log(qb.compile(new QueryCompiler()).sql)
  })

  it('from', async () => {
    const [res] = await db
      .query('someSchema.movie')
      .select('someSchema.movie.stars')
      .execute()

    const qb2 = db
      .query(() => db.query('movie').selectAll().as('m'))
      .select((qb) =>
        qb
          .subQuery('person')
          .whereRef('m.id', '=', 'person.id')
          .select('firstName')
          .as('f')
      )

    console.log(qb2.compile(new QueryCompiler()).sql)
  })

  it('raw', async () => {
    const qb = db.query('movie').select(() =>
      db
        .raw<number>('what(??, ?) \\?\\? ?', ['foo.bar', 1, 100])
        .as('thing')
    )

    console.log(qb.compile(new QueryCompiler()).sql)
  })

  it('simple perf test for building the query', async () => {
    const compiler = new QueryCompiler()

    function test() {
      const qb = db
        .query(['animal', 'person as p'])
        .select('animal.name')
        .distinctOn('p.firstName')
        .whereRef('p.lastName', '=', 'animal.name')
        .where('animal.name', 'in', ['foo', 'bar', 'baz'])
        .whereExists((qb) =>
          qb.subQuery('movie as m').whereRef('m.id', '=', 'p.id').selectAll()
        )

      qb.compile(compiler)
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

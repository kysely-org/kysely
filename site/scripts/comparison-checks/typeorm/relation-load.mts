import assert from 'node:assert/strict'
import { connect, Person, typeormVersion } from './_setup.mts'

const { dataSource, queries, cleanup } = await connect()
const repository = dataSource.getRepository(Person)
const shape = (people: Person[]) =>
  people.map((person) => `${person.first_name}:${person.pets.length}`)

queries.length = 0
const joined = await repository.find({
  relations: { pets: true },
  order: { first_name: 'ASC' },
})
assert.equal(queries.length, 1)
assert.deepEqual(shape(joined), ['Ada:1', 'Arnold:1', 'Jennifer:2', 'Sylvester:0'])

queries.length = 0
const separate = await repository.find({
  relations: { pets: true },
  relationLoadStrategy: 'query',
  order: { first_name: 'ASC' },
})
assert.equal(queries.length, 3)
assert.doesNotMatch(queries[0]!, /JOIN/)
assert.match(queries[1]!, /FROM "[^"]+"\."pet"/)
assert.match(queries[2]!, /"owner_id" IN \(\d+, \d+, \d+, \d+\)/)
assert.deepEqual(shape(separate), shape(joined))

queries.length = 0
const page = await repository.find({
  relations: { pets: true },
  relationLoadStrategy: 'query',
  order: { first_name: 'ASC' },
  take: 2,
})
assert.equal(queries.length, 3)
assert.deepEqual(shape(page), ['Ada:1', 'Arnold:1'])

queries.length = 0
const viaBuilder = await repository
  .createQueryBuilder('person')
  .setFindOptions({ relations: { pets: true }, relationLoadStrategy: 'query' })
  .orderBy('person.first_name')
  .getMany()
assert.equal(queries.length, 3)
assert.deepEqual(shape(viaBuilder), shape(joined))

await cleanup()
console.log(
  `PASS (TypeORM ${typeormVersion}): relationLoadStrategy 'query' loading one relation in three statements without repeating parents, paging parents with take(), and reaching the builder through setFindOptions()`,
)

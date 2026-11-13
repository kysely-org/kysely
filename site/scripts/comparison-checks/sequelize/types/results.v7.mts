import { col, fn, type InferAttributes } from '@sequelize/core'
import { expectType, Person, Pet, type Equal } from '../_setup.mts'

async function check() {
  const report = await Person.findAll({
    attributes: ['id', 'first_name', [fn('COUNT', col('pets.id')), 'pet_count']],
    include: [{ model: Pet, as: 'pets', attributes: [] }],
    group: ['Person.id'],
    raw: true,
  })
  expectType<Equal<typeof report, InferAttributes<Person>[]>>()
  // @ts-expect-error pet_count is not on the model type.
  report[0].pet_count

  // @ts-expect-error 7.0.0-alpha.48 checks attribute names.
  void Person.findAll({ attributes: ['first_nam'] })

  const renamed = await Person.findOne({ attributes: [['first_name', 'name']], raw: true })
  expectType<Equal<typeof renamed, InferAttributes<Person> | null>>()

  // A raw row type can be declared, and a stale one still compiles.
  const declared = await Person.findAll<Person, { name: string }>({ attributes: [['first_name', 'name']], raw: true })
  expectType<Equal<typeof declared, { name: string }[]>>()
  void Person.findAll<Person, { first_name: string }>({ attributes: [['first_name', 'name']], raw: true })
}
void check

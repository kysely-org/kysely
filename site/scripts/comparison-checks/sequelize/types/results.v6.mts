import { col, fn } from 'sequelize'
import { expectType, Person, Pet, type Equal } from '../_setup.mts'

async function check() {
  const report = await Person.findAll({
    attributes: ['id', 'first_name', [fn('COUNT', col('pets.id')), 'pet_count']],
    include: [{ model: Pet, as: 'pets', attributes: [] }],
    group: ['Person.id'],
    raw: true,
  })
  expectType<Equal<typeof report, Person[]>>()
  // @ts-expect-error pet_count is not on the model type.
  report[0].pet_count

  // A misspelled attribute name compiles on 6.37.8.
  void Person.findAll({ attributes: ['first_nam'] })

  const renamed = await Person.findOne({ attributes: [['first_name', 'name']], raw: true })
  expectType<Equal<typeof renamed, Person | null>>()
}
void check

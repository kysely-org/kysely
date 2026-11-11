import { DataSource, EntitySchema } from '#typeorm-under-test'

class Person {
  declare id: number
  declare first_name: string
}

const PersonSchema = new EntitySchema<Person>({
  name: 'Person',
  target: Person,
  tableName: 'person',
  columns: {
    id: { type: Number, primary: true },
    first_name: { type: String },
  },
})

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.COMPARISON_DATABASE_URL,
  entities: [PersonSchema],
})
await dataSource.initialize()
console.log(
  dataSource
    .getMetadata(Person)
    .columns.map((c) => c.propertyName)
    .join(','),
)
await dataSource.destroy()

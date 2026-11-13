import assert from 'node:assert/strict'
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely'
import { KyselySequelizeDialect, type KyselifyModel } from 'kysely-sequelize'
import { Sequelize, Model, DataTypes, type InferAttributes, type InferCreationAttributes, type CreationOptional, type NonAttribute } from 'sequelize'
import { connect, isAlpha, expectType, type Equal } from './_setup.mts'

class Person extends Model<InferAttributes<Person>, InferCreationAttributes<Person>> {
  declare id: CreationOptional<number>
  declare first_name: string
  declare age: number | null
  declare pet_target: number
  declare pets?: NonAttribute<Pet[]>
}
class Pet extends Model<InferAttributes<Pet>, InferCreationAttributes<Pet>> {
  declare id: CreationOptional<number>
  declare name: string
  declare owner_id: number
}

interface Database {
  person: KyselifyModel<Person>
  pet: KyselifyModel<Pet>
}

if (!isAlpha) {
  const { cleanup, schema, url } = await connect()
  const sequelize = new Sequelize(url, { dialect: 'postgres', logging: false, dialectOptions: { options: `-c search_path=${schema}` } })
  Person.init({ id: { type: DataTypes.INTEGER, primaryKey: true }, first_name: DataTypes.TEXT, age: DataTypes.INTEGER, pet_target: DataTypes.INTEGER }, { sequelize, tableName: 'person', timestamps: false })
  Pet.init({ id: { type: DataTypes.INTEGER, primaryKey: true }, name: DataTypes.TEXT, owner_id: DataTypes.INTEGER }, { sequelize, tableName: 'pet', timestamps: false })

  const db = new Kysely<Database>({
    dialect: new KyselySequelizeDialect({
      kyselySubDialect: {
        createAdapter: () => new PostgresAdapter(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
      sequelize,
    }),
  })
  const rows = await db.selectFrom('person').innerJoin('pet', 'pet.owner_id', 'person.id').select(['person.first_name', 'pet.name']).orderBy('pet.id').execute()
  expectType<Equal<typeof rows, { first_name: string; name: string }[]>>()
  assert.deepEqual(rows.map((r) => r.name), ['Catto', 'Doggo', 'Kitty', 'Parrot'])
  await db.insertInto('person').values({ first_name: 'Grace', age: null, pet_target: 0, id: 5 }).execute()
  await sequelize.close()
  await cleanup()
  console.log('PASS bridge.mts')
} else {
  console.log('SKIP bridge.mts: kysely-sequelize 0.2.0 peers sequelize < 7')
}

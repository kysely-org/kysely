import assert from 'node:assert/strict'
import {
  DataTypes,
  Model,
  QueryTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from '#sequelize-under-test'
import { connect } from './_setup.mts'

const { db, sequelize, queries, cleanup } = await connect()
await db.schema.alterTable('person').addColumn('deleted_at', 'timestamptz').execute()

class Owner extends Model<InferAttributes<Owner>, InferCreationAttributes<Owner>> {
  declare id: number
  declare first_name: string
}
class OwnedPet extends Model<InferAttributes<OwnedPet>, InferCreationAttributes<OwnedPet>> {
  declare id: number
  declare name: string
  declare owner_id: number
  declare owner?: NonAttribute<Owner>
}
Owner.init(
  { id: { type: DataTypes.INTEGER, primaryKey: true }, first_name: DataTypes.TEXT },
  { sequelize, tableName: 'person', modelName: 'Owner', paranoid: true, timestamps: true, createdAt: false, updatedAt: false, deletedAt: 'deleted_at' },
)
OwnedPet.init(
  { id: { type: DataTypes.INTEGER, primaryKey: true }, name: DataTypes.TEXT, owner_id: DataTypes.INTEGER },
  { sequelize, tableName: 'pet', modelName: 'OwnedPet' },
)
OwnedPet.belongsTo(Owner, { as: 'owner', foreignKey: 'owner_id' })

// destroy() on a paranoid model is an UPDATE that sets the delete date.
queries.length = 0
await Owner.destroy({ where: { id: 1 } })
assert.match(queries[0], /^Executing \(default\): UPDATE "person" SET "deleted_at"=\$1 WHERE "deleted_at" IS NULL AND "id" = /)

// An include of a paranoid model adds the filter to the join condition.
queries.length = 0
const pets = await OwnedPet.findAll({ include: [{ model: Owner, as: 'owner' }], order: [['id', 'ASC']] })
assert.match(queries[0], /ON "OwnedPet"\."owner_id" = "owner"\."id" AND \(?"owner"\."deleted_at" IS NULL\)?/)
assert.deepEqual(pets.map((pet) => [pet.name, pet.owner?.first_name ?? null]), [
  ['Catto', null],
  ['Doggo', null],
  ['Kitty', 'Arnold'],
  ['Parrot', 'Ada'],
])

// include.paranoid: false lifts it.
const all = await OwnedPet.findAll({ include: [{ model: Owner, as: 'owner', paranoid: false }], order: [['id', 'ASC']] })
assert.equal(all[0].owner?.first_name, 'Jennifer')

// A raw query is sent as written.
const [{ count }] = await sequelize.query<{ count: string }>('select count(*) from person', { type: QueryTypes.SELECT })
assert.equal(count, '4')

// Kysely compiles the join written, with no condition added.
assert.equal(
  db.selectFrom('pet').leftJoin('person', 'person.id', 'pet.owner_id').select(['pet.name', 'person.first_name as owner']).compile().sql,
  'select "pet"."name", "person"."first_name" as "owner" from "pet" left join "person" on "person"."id" = "pet"."owner_id"',
)

await cleanup()
console.log('PASS rewrites.mts')

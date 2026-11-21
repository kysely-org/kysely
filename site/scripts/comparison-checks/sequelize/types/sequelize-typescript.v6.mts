import { Model } from 'sequelize-typescript'

// sequelize-typescript's README writes `extends Model`, whose attributes are `any`.
class Loose extends Model {
  declare first_name: string
}

interface PersonAttributes {
  id: number
  first_name: string
}
class Strict extends Model<PersonAttributes, PersonAttributes> {
  declare first_name: string
}

void Loose.findAll({ where: { first_nam: 'Jennifer' } })
// @ts-expect-error first_nam is not an attribute.
void Strict.findAll({ where: { first_nam: 'Jennifer' } })

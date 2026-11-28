import { Sequelize } from 'sequelize'
import type { Model, ModelStatic } from 'sequelize'
export {
  Model,
  DataTypes,
  Op,
  fn,
  col,
  cast,
  literal,
  where,
  QueryTypes,
  DatabaseError,
  Transaction,
} from 'sequelize'
export type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  WhereOptions,
} from 'sequelize'

export const sequelizeVersion = '6.37.8'

export function scoped<M extends Model>(
  model: ModelStatic<M>,
  name: string | { method: [string, ...unknown[]] },
) {
  return model.scope(name)
}

export function connectSequelize(
  url: string,
  schema: string,
  logging: (sql: string) => void,
) {
  return new Sequelize(url, {
    dialect: 'postgres',
    logging,
    dialectOptions: { options: `-c search_path=${schema}` },
    define: { timestamps: false },
  })
}

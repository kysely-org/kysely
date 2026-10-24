import { Sequelize } from 'sequelize'
import type { Model, ModelStatic } from 'sequelize'
export {
  Model,
  DataTypes,
  Op,
  fn,
  col,
  cast,
  where,
  QueryTypes,
} from 'sequelize'
export type {
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize'

export function scoped<M extends Model>(model: ModelStatic<M>, name: string) {
  return model.scope(name)
}

export function connectSequelize(url: string, schema: string) {
  return new Sequelize(url, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { options: `-c search_path=${schema}` },
    define: { timestamps: false, schema },
  })
}

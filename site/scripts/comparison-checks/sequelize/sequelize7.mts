import { Sequelize } from '@sequelize/core'
import type { Model, ModelStatic } from '@sequelize/core'
import { PostgresDialect } from '@sequelize/postgres'
export {
  Model,
  DataTypes,
  Op,
  fn,
  col,
  cast,
  where,
  QueryTypes,
} from '@sequelize/core'
export type {
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from '@sequelize/core'

export function scoped<M extends Model>(model: ModelStatic<M>, name: string) {
  return model.withScope(name)
}

export function connectSequelize(url: string, schema: string) {
  return new Sequelize({
    dialect: PostgresDialect,
    url,
    options: `-c search_path=${schema}`,
    logging: false,
    define: { timestamps: false, schema },
  })
}

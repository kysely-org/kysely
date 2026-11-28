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
  literal,
  where,
  QueryTypes,
  DatabaseError,
  Transaction,
} from '@sequelize/core'
export type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  WhereOptions,
} from '@sequelize/core'

export const sequelizeVersion = '7.0.0-alpha.48'

export function scoped<M extends Model>(
  model: ModelStatic<M>,
  name: string | { method: [string, ...unknown[]] },
) {
  return model.withScope(name)
}

export function connectSequelize(
  url: string,
  schema: string,
  logging: (sql: string) => void,
) {
  return new Sequelize({
    dialect: PostgresDialect,
    url,
    options: `-c search_path=${schema}`,
    logging,
    define: { timestamps: false },
  })
}

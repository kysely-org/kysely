import { Config } from '../src/config'

export const testConfig: Config = {
  port: 3001,
  database: {
    host: 'localhost',
    dialect: 'postgres',
    database: 'kysely_koa_example_test',
  },
}

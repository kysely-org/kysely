import { KyselyConfig } from 'kysely'
import { Config } from '../src/config'

export interface TestConfig extends Config {
  adminDatabase: KyselyConfig
}

export const testConfig: TestConfig = {
  port: 3001,
  database: {
    host: 'localhost',
    dialect: 'postgres',
    database: 'kysely_koa_example_test',
  },
  adminDatabase: {
    host: 'localhost',
    dialect: 'postgres',
    database: 'postgres',
  },
}

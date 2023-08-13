import { DefaultTypeConfig } from '../../database.js'

export interface MysqlTypeConfig extends DefaultTypeConfig {}

export function mysqlTypeConfig(): MysqlTypeConfig {
  return undefined!
}

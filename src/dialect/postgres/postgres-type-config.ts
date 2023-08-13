import { DefaultTypeConfig } from '../../database.js'

export interface PostgresTypeConfig extends DefaultTypeConfig {}

export function postgresTypeConfig(): PostgresTypeConfig {
  return undefined!
}

import { DefaultTypeConfig } from '../../database.js'

export interface SqliteTypeConfig extends DefaultTypeConfig {}

export function sqliteTypeConfig(): SqliteTypeConfig {
  return undefined!
}

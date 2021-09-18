import * as dotenv from 'dotenv'
import { KyselyConfig } from 'kysely'

dotenv.config()

export interface Config {
  readonly port: number
  readonly authTokenSecret: string
  readonly authTokenExpiryDuration: string
  readonly database: KyselyConfig
}

export const config: Config = Object.freeze({
  port: parseInt(getEnvVariable('PORT'), 10),
  authTokenSecret: getEnvVariable('AUTH_TOKEN_SECRET'),
  authTokenExpiryDuration: getEnvVariable('AUTH_TOKEN_EXIRY_DURATION'),
  database: Object.freeze({
    dialect: 'postgres' as const,
    database: getEnvVariable('DATABASE'),
    host: getEnvVariable('DATABASE_HOST'),
    user: getEnvVariable('DATABASE_USER'),
  }),
})

function getEnvVariable(name: string): string {
  if (!process.env[name]) {
    throw new Error(`environment variable ${name} not found`)
  }

  return process.env[name]!
}

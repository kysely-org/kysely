import * as dotenv from 'dotenv'
import { KyselyConfig } from 'kysely'

dotenv.config()

export interface Config {
  port: number
  database: KyselyConfig
}

export const config: Config = Object.freeze({
  port: parseInt(process.env.PORT!, 10),
  database: Object.freeze({
    dialect: 'postgres' as const,
    database: process.env.DATABASE!,
    host: process.env.DATABASE_HOST!,
    user: process.env.DATABASE_USER!,
  }),
})

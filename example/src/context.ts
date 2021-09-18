import * as Koa from 'koa'

import { Kysely } from 'kysely'
import { Database } from './database'

export interface Context extends Koa.BaseContext {
  db: Kysely<Database>
}

import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'

import { Kysely } from 'kysely'
import { Database } from './database'

export interface ContextExtension {
  db: Kysely<Database>
}

export type Context = Koa.ParameterizedContext<
  any,
  ContextExtension & KoaRouter.IRouterParamContext<any, ContextExtension>,
  any
>

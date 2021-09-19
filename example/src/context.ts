import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'

import { Kysely } from 'kysely'
import { Database } from './database'
import { ErrorCode } from './util/errors'

export interface ContextExtension {
  db: Kysely<Database>

  throwError(
    status: number,
    code: ErrorCode,
    message: string,
    data?: any
  ): never
}

export type Context = Koa.ParameterizedContext<
  any,
  ContextExtension & KoaRouter.IRouterParamContext<any, ContextExtension>,
  any
>

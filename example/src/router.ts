import * as KoaRouter from 'koa-router'

import { Context } from './context'

export class Router extends KoaRouter<any, Context> {}

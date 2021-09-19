import * as KoaRouter from 'koa-router'

import { ContextExtension } from './context'

export class Router extends KoaRouter<any, ContextExtension> {}

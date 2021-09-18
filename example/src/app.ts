import * as Koa from 'koa'
import * as json from 'koa-json'
import * as compress from 'koa-compress'
import { Server } from 'http'
import { Kysely } from 'kysely'

import { Config } from './config'
import { Context } from './context'
import { Database } from './database'
import { Router } from './router'
import { userController } from './user/user.controller'

export class App {
  #config: Config
  #koa: Koa<any, Context>
  #router: Router
  #db: Kysely<Database>
  #server?: Server

  constructor(config: Config) {
    this.#config = config
    this.#koa = new Koa()
    this.#router = new Router()
    this.#db = new Kysely(config.database)

    this.#koa.use(compress())
    this.#koa.use(json())
    this.#koa.use(async (ctx, next) => {
      ctx.db = this.#db
      await next()
    })

    userController(this.#router)

    this.#koa.use(this.#router.routes())
    this.#koa.use(this.#router.allowedMethods())
  }

  get db(): Kysely<Database> {
    return this.#db
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.#server = this.#koa.listen(this.#config.port, resolve)
    })
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.#server?.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    await this.#db.destroy()
  }
}

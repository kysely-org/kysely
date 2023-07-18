import * as path from 'path'
import axios from 'axios'
import { promises as fs } from 'fs'
import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
  sql,
} from 'kysely'

import { testConfig } from './test-config'
import { App } from '../src/app'
import { Database } from '../src/database'
import { User } from '../src/user/user'
import { Pool } from 'pg'

export class TestContext {
  #app?: App

  request = axios.create({
    baseURL: `http://localhost:${testConfig.port}`,
    validateStatus: () => true,
  })

  get db(): Kysely<Database> {
    return this.#app!.db
  }

  before = async (): Promise<void> => {
    const adminDb = new Kysely<any>({
      dialect: new PostgresDialect({
        pool: new Pool(testConfig.adminDatabase),
      }),
    })

    // Create our test database
    const { database } = testConfig.database
    await sql`drop database if exists ${sql.id(database!)}`.execute(adminDb)
    await sql`create database ${sql.id(database!)}`.execute(adminDb)
    await adminDb.closeConnection()

    // Now connect to the test databse and run the migrations
    const db = new Kysely<any>({
      dialect: new PostgresDialect({
        pool: new Pool(testConfig.database),
      }),
    })

    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(__dirname, '../src/migrations'),
      }),
    })

    await migrator.migrateToLatest()
    await db.closeConnection()
  }

  after = async (): Promise<void> => {
    // Nothing to do here at the moment
  }

  beforeEach = async (): Promise<void> => {
    this.#app = new App(testConfig)

    // Clear the database
    await this.db.deleteFrom('user').execute()

    await this.#app.start()
  }

  afterEach = async (): Promise<void> => {
    await this.#app?.stop()
    this.#app = undefined
  }

  createUser = async (): Promise<{
    user: User
    authToken: string
    refreshToken: string
  }> => {
    const res = await this.request.post(`/api/v1/user`, {
      firstName: 'Test',
      lastName: 'Testerson',
    })

    return res.data
  }
}

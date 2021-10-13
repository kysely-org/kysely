import * as path from 'path'
import axios from 'axios'
import { Kysely, PostgresDialect } from 'kysely'

import { testConfig } from './test-config'
import { App } from '../src/app'
import { Database } from '../src/database'
import { SignedInUser } from '../src/user/user.service'

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
    const adminDb = await Kysely.create<any>({
      dialect: new PostgresDialect(testConfig.adminDatabase),
    })

    // Create our test database
    const { database } = testConfig.database
    await adminDb.raw(`drop database if exists ${database}`).execute()
    await adminDb.raw(`create database ${database}`).execute()
    await adminDb.destroy()

    // Now connect to the test databse and run the migrations
    const db = await Kysely.create<any>({
      dialect: new PostgresDialect(testConfig.database),
    })

    await db.migration.migrateToLatest(
      path.join(__dirname, '../src/migrations')
    )
    await db.destroy()
  }

  after = async (): Promise<void> => {
    // Nothing to do here at the moment
  }

  beforeEach = async (): Promise<void> => {
    this.#app = new App(testConfig)

    await this.#app.start()

    // Clear the database
    await this.db.deleteFrom('user').execute()
  }

  afterEach = async (): Promise<void> => {
    await this.#app?.stop()
    this.#app = undefined
  }

  createUser = async (): Promise<SignedInUser> => {
    const res = await this.request.post<SignedInUser>(`/api/v1/user`, {
      firstName: 'Test',
      lastName: 'Testerson',
    })

    return res.data
  }
}

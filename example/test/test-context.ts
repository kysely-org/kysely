import * as path from 'path'
import axios from 'axios'
import { Kysely } from 'kysely'

import { testConfig } from './test-config'
import { App } from '../src/app'
import { Database } from '../src/database'
import { User } from '../src/user/user'
import { userRepository } from '../src/user/user.repository'
import { userService } from '../src/user/user.service'

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
    const adminDb = new Kysely<any>(testConfig.adminDatabase)

    // Create our test database
    const { database } = testConfig.database
    await adminDb.raw(`drop database if exists ${database}`).execute()
    await adminDb.raw(`create database ${database}`).execute()
    await adminDb.destroy()

    // Now connect to the test databse and run the migrations
    const db = new Kysely<any>(testConfig.database)
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

    // Clear the database
    await this.db.deleteFrom('user').execute()

    await this.#app.start()
  }

  afterEach = async (): Promise<void> => {
    await this.#app?.stop()
    this.#app = undefined
  }

  createUser = async (): Promise<User> => {
    const user = await userRepository.insertUser(this.db, {
      first_name: 'Foo',
      last_name: 'Fighter',
      email: 'foo@fighter.fake',
    })

    return userService.userRowToUser(user)
  }
}

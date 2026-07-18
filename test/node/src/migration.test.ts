import fs from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import { createSandbox, type SinonSpy } from 'sinon'
import type { Kysely } from '../../../dist/index.js'
import {
  FileMigrationProvider,
  type Migration,
  type MigrationConfig,
  type MigrationResultSet,
  DEFAULT_MIGRATION_LOCK_TABLE,
  DEFAULT_MIGRATION_TABLE,
  type MigrationProvider,
  Migrator,
  NO_MIGRATIONS,
  type MigratorProps,
} from '../../../dist/migration/index.js'
import {
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  type TestContext,
  DIALECTS,
  type Database,
} from './test-setup.js'

const CUSTOM_MIGRATION_SCHEMA = 'migrate'
const CUSTOM_MIGRATION_TABLE = 'custom_migrations'
const CUSTOM_MIGRATION_LOCK_TABLE = 'custom_migrations_lock'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: migration`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
      await deleteMigrationTables()
    })

    afterEach(async () => {
      await deleteMigrationTables()
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('getMigrations', () => {
      it('should get migrations', async () => {
        const { migrator } = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        const migrations1 = await migrator.getMigrations()
        expect(migrations1).to.have.length(3)
        expect(migrations1[0].name).to.equal('migration1')
        expect(migrations1[0].executedAt).to.equal(undefined)
        expect(migrations1[1].name).to.equal('migration2')
        expect(migrations1[1].executedAt).to.equal(undefined)
        expect(migrations1[2].name).to.equal('migration3')
        expect(migrations1[2].executedAt).to.equal(undefined)

        await migrator.migrateTo('migration2')

        const migrations2 = await migrator.getMigrations()
        expect(migrations2).to.have.length(3)
        expect(migrations2[0].name).to.equal('migration1')
        expect(migrations2[0].executedAt).to.be.instanceOf(Date)
        expect(migrations2[1].name).to.equal('migration2')
        expect(migrations2[1].executedAt).to.be.instanceOf(Date)
        expect(migrations2[2].name).to.equal('migration3')
        expect(migrations2[2].executedAt).to.equal(undefined)
      })
    })

    describe('migrateToLatest', () => {
      it('should run all unexecuted migrations', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration2'])

        const { results: results1 } = await migrator1.migrateToLatest()

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        const { results: results2 } = await migrator2.migrateToLatest()

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration2'])
        expect(executedUpMethods2).to.eql(['migration3', 'migration4'])
      })

      it('should return an error if a new migration is added before the last executed one', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration3'])

        await migrator1.migrateToLatest()

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations(['migration1', 'migration2', 'migration3'])

        const { error } = await migrator2.migrateToLatest()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: expected previously executed migration migration3 to be at index 1 but migration2 was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.',
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql([])
      })

      it('should run a new migration added before the last executed one with allowUnorderedMigrations enabled', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration3'], {
            allowUnorderedMigrations: true,
          })

        const { results: results1 } = await migrator1.migrateToLatest()

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations(
            ['migration1', 'migration2', 'migration3', 'migration4'],
            { allowUnorderedMigrations: true },
          )

        const { results: results2 } = await migrator2.migrateToLatest()

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql(['migration2', 'migration4'])
      })

      it('should return an error if a previously executed migration is missing', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration2', 'migration3'])

        await migrator1.migrateToLatest()

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations(['migration2', 'migration3', 'migration4'])

        const { error } = await migrator2.migrateToLatest()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: previously executed migration migration1 is missing',
        )

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedUpMethods2).to.eql([])
      })

      it('should return an error if a the last executed migration is not found', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration2', 'migration3'])

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations(['migration1', 'migration2', 'migration4'])

        await migrator1.migrateToLatest()
        const { error } = await migrator2.migrateToLatest()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: previously executed migration migration3 is missing',
        )

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedUpMethods2).to.eql([])
      })

      describe('with allowUnorderedMigrations', () => {
        it('should return an error if a previously executed migration is missing', async () => {
          const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
            createMigrations(['migration1', 'migration2', 'migration3'], {
              allowUnorderedMigrations: true,
            })

          await migrator1.migrateToLatest()

          const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
            createMigrations(['migration2', 'migration3', 'migration4'], {
              allowUnorderedMigrations: true,
            })

          const { error } = await migrator2.migrateToLatest()

          expect(error).to.be.an.instanceOf(Error)
          expect(getMessage(error)).to.eql(
            'corrupted migrations: previously executed migration migration1 is missing',
          )

          expect(executedUpMethods1).to.eql([
            'migration1',
            'migration2',
            'migration3',
          ])
          expect(executedUpMethods2).to.eql([])
        })

        it('should return an error if a the last executed migration is not found', async () => {
          const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
            createMigrations(['migration1', 'migration2', 'migration3'], {
              allowUnorderedMigrations: true,
            })

          const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
            createMigrations(['migration1', 'migration2', 'migration4'], {
              allowUnorderedMigrations: true,
            })

          await migrator1.migrateToLatest()
          const { error } = await migrator2.migrateToLatest()

          expect(error).to.be.an.instanceOf(Error)
          expect(getMessage(error)).to.eql(
            'corrupted migrations: previously executed migration migration3 is missing',
          )

          expect(executedUpMethods1).to.eql([
            'migration1',
            'migration2',
            'migration3',
          ])
          expect(executedUpMethods2).to.eql([])
        })
      })

      it('should return an error if one of the migrations fails', async () => {
        const { migrator, executedUpMethods } = createMigrations([
          'migration1',
          { name: 'migration2', error: 'whoopsydaisy' },
          'migration3',
        ])

        const { error, results } = await migrator.migrateToLatest()

        expect(getMessage(error)).to.equal('whoopsydaisy')

        expect(results).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Error' },
          {
            migrationName: 'migration3',
            direction: 'Up',
            status: 'NotExecuted',
          },
        ])

        expect(executedUpMethods).to.eql(['migration1'])
      })

      it('should work correctly when run in parallel', async () => {
        const { migrator, executedUpMethods } = createMigrations([
          'migration1',
          'migration2',
        ])

        const promises: Promise<MigrationResultSet>[] = []
        for (let i = 0; i < 100; ++i) {
          promises.push(migrator.migrateToLatest())
        }

        await Promise.all(promises)
        expect(executedUpMethods).to.eql(['migration1', 'migration2'])
      })

      describe('using folder of migration files', () => {
        beforeEach(async () => {
          await dropTestMigrationTables()
        })

        afterEach(async () => {
          await dropTestMigrationTables()
        })

        it('should run migrations from a folder', async () => {
          const migrator = new Migrator({
            db: ctx.db,
            provider: new FileMigrationProvider({
              fs,
              path: { join },
              migrationFolder: join(__dirname, 'test-migrations'),
            }),
          })

          await migrator.migrateToLatest()

          // The migrations should create two tables test1 and test2.
          // Make sure they were correctly created.

          expect(await doesTableExists('test1')).to.eql(true)
          expect(await doesTableExists('test2')).to.eql(true)
        })

        async function dropTestMigrationTables(): Promise<void> {
          await ctx.db.schema.dropTable('test2').ifExists().execute()
          await ctx.db.schema.dropTable('test1').ifExists().execute()
        }
      })
    })

    describe('migrateTo', () => {
      it('should migrate up to a specific migration', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        const { results: results1 } = await migrator1.migrateTo('migration2')

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        const { results: results2 } = await migrator2.migrateTo('migration3')

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration2'])
        expect(executedUpMethods2).to.eql(['migration3'])
      })

      it('should migrate all the way down', async () => {
        const { migrator, executedUpMethods, executedDownMethods } =
          createMigrations(['migration1', 'migration2', 'migration3'])

        const { results: results1 } = await migrator.migrateToLatest()
        const { results: results2 } = await migrator.migrateTo(NO_MIGRATIONS)

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration3', direction: 'Down', status: 'Success' },
          { migrationName: 'migration2', direction: 'Down', status: 'Success' },
          { migrationName: 'migration1', direction: 'Down', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedDownMethods).to.eql([
          'migration3',
          'migration2',
          'migration1',
        ])
      })

      it('should migrate all the way down with a foreign NO_MIGRATIONS object', async () => {
        const { migrator, executedUpMethods, executedDownMethods } =
          createMigrations(['migration1', 'migration2', 'migration3'])

        const { results: results1 } = await migrator.migrateToLatest()
        const { results: results2 } = await migrator.migrateTo({
          __noMigrations__: true,
        })

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration3', direction: 'Down', status: 'Success' },
          { migrationName: 'migration2', direction: 'Down', status: 'Success' },
          { migrationName: 'migration1', direction: 'Down', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedDownMethods).to.eql([
          'migration3',
          'migration2',
          'migration1',
        ])
      })

      it('should migrate down to a specific migration', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        const { results: results1 } = await migrator1.migrateTo('migration4')

        const {
          migrator: migrator2,
          executedUpMethods: executedUpMethods2,
          executedDownMethods: executedDownMethods2,
        } = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results2 } = await migrator2.migrateTo('migration2')

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration4', direction: 'Down', status: 'Success' },
          { migrationName: 'migration3', direction: 'Down', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        expect(executedUpMethods2).to.eql([])
        expect(executedDownMethods2).to.eql(['migration4', 'migration3'])
      })

      describe('with allowUnorderedMigrations enabled', () => {
        it('should migrate up to a specific migration', async () => {
          const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
            createMigrations(
              ['migration1', 'migration3', 'migration4', 'migration5'],
              { allowUnorderedMigrations: true },
            )

          const { results: results1 } = await migrator1.migrateTo('migration3')

          const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
            createMigrations(
              [
                'migration1',
                'migration2',
                'migration3',
                'migration4',
                'migration5',
              ],
              { allowUnorderedMigrations: true },
            )

          const { results: results2 } = await migrator2.migrateTo('migration4')

          expect(results1).to.eql([
            { migrationName: 'migration1', direction: 'Up', status: 'Success' },
            { migrationName: 'migration3', direction: 'Up', status: 'Success' },
          ])

          expect(results2).to.eql([
            { migrationName: 'migration2', direction: 'Up', status: 'Success' },
            { migrationName: 'migration4', direction: 'Up', status: 'Success' },
          ])

          expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
          expect(executedUpMethods2).to.eql(['migration2', 'migration4'])
        })

        it('should migrate all the way down', async () => {
          const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
            createMigrations(['migration1', 'migration2', 'migration4'], {
              allowUnorderedMigrations: true,
            })

          const { results: results1 } = await migrator1.migrateToLatest()

          const {
            migrator: migrator2,
            executedUpMethods: executedUpMethods2,
            executedDownMethods: executedDownMethods2,
          } = createMigrations(
            ['migration1', 'migration2', 'migration3', 'migration4'],
            { allowUnorderedMigrations: true },
          )

          const { results: results2 } = await migrator2.migrateTo(NO_MIGRATIONS)

          expect(results1).to.eql([
            { migrationName: 'migration1', direction: 'Up', status: 'Success' },
            { migrationName: 'migration2', direction: 'Up', status: 'Success' },
            { migrationName: 'migration4', direction: 'Up', status: 'Success' },
          ])

          expect(results2).to.eql([
            {
              migrationName: 'migration4',
              direction: 'Down',
              status: 'Success',
            },
            {
              migrationName: 'migration2',
              direction: 'Down',
              status: 'Success',
            },
            {
              migrationName: 'migration1',
              direction: 'Down',
              status: 'Success',
            },
          ])

          expect(executedUpMethods1).to.eql([
            'migration1',
            'migration2',
            'migration4',
          ])
          expect(executedUpMethods2).to.eql([])
          expect(executedDownMethods2).to.eql([
            'migration4',
            'migration2',
            'migration1',
          ])
        })

        it('should migrate down to a specific migration', async () => {
          const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
            createMigrations(
              ['migration1', 'migration2', 'migration3', 'migration5'],
              { allowUnorderedMigrations: true },
            )

          const { results: results1 } = await migrator1.migrateTo('migration5')

          const {
            migrator: migrator2,
            executedUpMethods: executedUpMethods2,
            executedDownMethods: executedDownMethods2,
          } = createMigrations(
            [
              'migration1',
              'migration2',
              'migration3',
              'migration4',
              'migration5',
            ],
            { allowUnorderedMigrations: true },
          )

          const { results: results2 } = await migrator2.migrateTo('migration2')

          expect(results1).to.eql([
            { migrationName: 'migration1', direction: 'Up', status: 'Success' },
            { migrationName: 'migration2', direction: 'Up', status: 'Success' },
            { migrationName: 'migration3', direction: 'Up', status: 'Success' },
            { migrationName: 'migration5', direction: 'Up', status: 'Success' },
          ])

          expect(results2).to.eql([
            {
              migrationName: 'migration5',
              direction: 'Down',
              status: 'Success',
            },
            {
              migrationName: 'migration3',
              direction: 'Down',
              status: 'Success',
            },
          ])

          expect(executedUpMethods1).to.eql([
            'migration1',
            'migration2',
            'migration3',
            'migration5',
          ])

          expect(executedUpMethods2).to.eql([])
          expect(executedDownMethods2).to.eql(['migration5', 'migration3'])
        })

        it('should migrate down if allowUnorderedMigrations is enabled and migration names are not in order', async () => {
          const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
            createMigrations(['migration1', 'migration3'], {
              allowUnorderedMigrations: true,
            })

          const { results: results1 } = await migrator1.migrateToLatest()

          const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
            createMigrations(['migration1', 'migration2', 'migration3'], {
              allowUnorderedMigrations: true,
            })

          const { results: results2 } = await migrator2.migrateToLatest()

          expect(results1).to.eql([
            { migrationName: 'migration1', direction: 'Up', status: 'Success' },
            { migrationName: 'migration3', direction: 'Up', status: 'Success' },
          ])

          expect(results2).to.eql([
            {
              migrationName: 'migration2',
              direction: 'Up',
              status: 'Success',
            },
          ])

          expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
          expect(executedUpMethods2).to.eql(['migration2'])

          const {
            migrator: migrator3,
            executedUpMethods: executedUpMethods3,
            executedDownMethods: executedDownMethods3,
          } = createMigrations(['migration1', 'migration2', 'migration3'], {
            allowUnorderedMigrations: true,
          })

          const { results: results3 } = await migrator3.migrateDown()
          expect(results3).to.eql([
            {
              migrationName: 'migration2',
              direction: 'Down',
              status: 'Success',
            },
          ])

          expect(executedUpMethods3).to.eql([])
          expect(executedDownMethods3).to.eql(['migration2'])
        })
      })
    })

    describe('migrateUp', () => {
      const sandbox = createSandbox()
      let transactionSpy: SinonSpy<
        Parameters<Kysely<Database>['transaction']>,
        ReturnType<Kysely<Database>['transaction']>
      >

      beforeEach(() => {
        transactionSpy = sandbox.spy(ctx.db, 'transaction')
      })

      afterEach(() => {
        sandbox.restore()
      })

      it('should migrate up one step', async () => {
        const { migrator, executedUpMethods } = createMigrations([
          'migration1',
          'migration2',
        ])

        const { results: results1 } = await migrator.migrateUp()

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1'])

        const { results: results2 } = await migrator.migrateUp()

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1', 'migration2'])

        const { results: results3 } = await migrator.migrateUp()

        expect(results3).to.eql([])
        expect(executedUpMethods).to.eql(['migration1', 'migration2'])
      })

      it('should return an error when migrating up if a new migration is added before the last executed one', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration3'])

        await migrator1.migrateToLatest()

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        const { error } = await migrator2.migrateUp()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: expected previously executed migration migration3 to be at index 1 but migration2 was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.',
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql([])
      })

      it('should migrate up one step with allowUnorderedMigrations enabled', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration3'], {
            allowUnorderedMigrations: true,
          })

        const { results: results1 } = await migrator1.migrateToLatest()

        const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
          createMigrations(
            ['migration1', 'migration2', 'migration3', 'migration4'],
            { allowUnorderedMigrations: true },
          )

        const { results: results2 } = await migrator2.migrateUp()
        const { results: results3 } = await migrator2.migrateUp()

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(results3).to.eql([
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql(['migration2', 'migration4'])
      })

      it('should not execute in transaction if disableTransactions is true on the `Migrator` instance', async () => {
        const { migrator, executedUpMethods } = createMigrations(
          ['migration1'],
          {
            disableTransactions: true,
          },
        )

        const { results } = await migrator.migrateUp()

        expect(results).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1'])

        expect(transactionSpy.called).to.be.false
      })

      it('should not execute in transaction if disableTransactions is true when calling `migrateUp`', async () => {
        const { migrator, executedUpMethods } = createMigrations(
          ['migration1'],
          {
            disableTransactions: false,
          },
        )

        const { results } = await migrator.migrateUp({
          disableTransactions: true,
        })

        expect(results).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1'])

        expect(transactionSpy.called).to.be.false
      })

      it('should execute in transaction if disableTransactions is false on the `Migrator` instance and transactionDdl supported', async () => {
        const shouldExecuteInTransaction =
          ctx.db.getExecutor().adapter.supportsTransactionalDdl

        const { migrator, executedUpMethods, executedInTransactions } =
          createMigrations(['migration1'], {
            disableTransactions: false,
          })

        const { results } = await migrator.migrateUp()

        expect(results).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1'])
        expect(executedInTransactions).to.eql([
          {
            name: 'migration1',
            isTransaction: shouldExecuteInTransaction,
          },
        ])
      })

      it('should execute in transaction when `migrateUp` is called with disableTransactions false even though the Migrator instance has disableTransactions true', async () => {
        const shouldExecuteInTransaction =
          ctx.db.getExecutor().adapter.supportsTransactionalDdl

        const { migrator, executedUpMethods, executedInTransactions } =
          createMigrations(['migration1'], {
            disableTransactions: true,
          })

        const { results } = await migrator.migrateUp({
          disableTransactions: false,
        })

        expect(results).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1'])
        expect(executedInTransactions).to.eql([
          {
            name: 'migration1',
            isTransaction: shouldExecuteInTransaction,
          },
        ])
      })

      if (sqlSpec === 'postgres' || sqlSpec === 'mssql') {
        it('should run migrations using a provided transaction', async () => {
          const migrationName = 'trx_connection_method_fail_case'

          const trx = await ctx.db.startTransaction().execute()

          try {
            const provider: MigrationProvider = {
              getMigrations: async () => ({
                [migrationName]: {
                  async up(db: Kysely<any>): Promise<void> {
                    expect(db).to.equal(trx)
                  },
                },
              }),
            }

            const migrator = new Migrator({ db: trx, provider })

            const { results, error } = await migrator.migrateUp()

            expect(trx.isCommitted).to.be.false
            expect(trx.isRolledBack).to.be.false

            expect(error).to.be.undefined
            expect(results).to.eql([
              { migrationName, direction: 'Up', status: 'Success' },
            ])
          } finally {
            await trx.rollback().execute()
          }
        })
      }

      if (variant === 'postgres' || variant === 'mssql') {
        it('should not run concurrent migrators in parallel when disableTransactions is true (issue #1894)', async () => {
          let startedRunning: () => void
          const migratorARunning = new Promise<void>(
            (resolve) => (startedRunning = resolve),
          )

          const { migrator: migratorA } = createMigrations(
            [
              {
                durationMs: 1_000,
                name: 'migrationA',
                preUp: () => startedRunning(),
              },
            ],
            { disableTransactions: true },
          )
          const { migrator: migratorB } = createMigrations(['migrationB'], {
            disableTransactions: false,
          })

          const [resultA, resultB] = await Promise.all([
            migratorA.migrateToLatest(),
            migratorARunning.then(() => migratorB.migrateToLatest()),
          ])

          expect(resultA.error).to.be.undefined
          expect(resultB.error)
            .to.be.instanceOf(Error)
            .and.satisfy((val: Error) =>
              val.message.includes('migrationA is missing'),
            )
        })
      }

      if (sqlSpec === 'mysql' || sqlSpec === 'sqlite') {
        it('should refuse to run migrations using a provided transaction due to lack of support for transactional DDL', async () => {
          const trx = await ctx.db.startTransaction().execute()
          try {
            const provider: MigrationProvider = {
              getMigrations: async () => ({
                some_migration: {
                  async up(db: Kysely<any>): Promise<void> {
                    expect(db).to.equal(trx)
                  },
                },
              }),
            }

            const migrator = new Migrator({ db: trx, provider })

            const { results, error } = await migrator.migrateUp()

            expect(error).to.be.an.instanceOf(Error)
            expect(getMessage(error)).to.eql(
              'Transactional DDL is not supported in this dialect. Passing a transaction to this migrator would result in failure or unexpected behavior.',
            )
            expect(results).to.be.undefined

            expect(trx.isCommitted).to.be.false
            expect(trx.isRolledBack).to.be.false
          } finally {
            await trx.rollback().execute()
          }
        })
      }
    })

    describe('transactionMode', () => {
      const sandbox = createSandbox()
      let transactionSpy: SinonSpy<
        Parameters<Kysely<Database>['transaction']>,
        ReturnType<Kysely<Database>['transaction']>
      >

      beforeEach(() => {
        const _connection = ctx.db.connection.bind(ctx.db)
        sandbox.stub(ctx.db, 'connection').callsFake(() => {
          const db = _connection()
          const _execute = db.execute.bind(db)
          sandbox.stub(db, 'execute').callsFake((cb) => {
            return _execute((db) => {
              transactionSpy = sandbox.spy(db, 'transaction')
              return cb(db)
            })
          })
          return db
        })
      })

      afterEach(() => {
        sandbox.restore()
      })

      if (sqlSpec === 'postgres' || sqlSpec === 'mssql') {
        describe("'per-migration'", () => {
          it('should run each migration in its own transaction', async () => {
            const { migrator, executedUpMethods, executedInTransactions } =
              createMigrations(['migration1', 'migration2', 'migration3'], {
                transactionMode: 'per-migration',
              })

            const { error, results } = await migrator.migrateToLatest()

            expect(error).to.be.undefined
            expect(results).to.eql([
              {
                migrationName: 'migration1',
                direction: 'Up',
                status: 'Success',
              },
              {
                migrationName: 'migration2',
                direction: 'Up',
                status: 'Success',
              },
              {
                migrationName: 'migration3',
                direction: 'Up',
                status: 'Success',
              },
            ])

            expect(executedUpMethods).to.eql([
              'migration1',
              'migration2',
              'migration3',
            ])
            expect(executedInTransactions).to.eql([
              { name: 'migration1', isTransaction: true },
              { name: 'migration2', isTransaction: true },
              { name: 'migration3', isTransaction: true },
            ])
            expect(transactionSpy.callCount).to.equal(3)
          })

          it('should keep earlier migrations applied when a later migration fails', async () => {
            const { migrator, executedUpMethods } = createMigrations(
              ['migration1', { name: 'migration2', error: 'whoopsydaisy' }],
              { transactionMode: 'per-migration' },
            )

            const { error, results } = await migrator.migrateToLatest()

            expect(getMessage(error)).to.equal('whoopsydaisy')
            expect(results).to.eql([
              {
                migrationName: 'migration1',
                direction: 'Up',
                status: 'Success',
              },
              { migrationName: 'migration2', direction: 'Up', status: 'Error' },
            ])
            expect(executedUpMethods).to.eql(['migration1'])

            const migrations = await migrator.getMigrations()

            expect(
              migrations.find((it) => it.name === 'migration1')?.executedAt,
            ).to.be.an.instanceOf(Date)
            expect(
              migrations.find((it) => it.name === 'migration2')?.executedAt,
            ).to.be.undefined
          })

          it('should not use a transaction for migrations with config.transaction false', async () => {
            const { migrator, executedInTransactions } = createMigrations(
              [
                'migration1',
                { name: 'migration2', config: { transaction: false } },
                'migration3',
              ],
              { transactionMode: 'per-migration' },
            )

            const { error } = await migrator.migrateToLatest()

            expect(error).to.be.undefined
            expect(executedInTransactions).to.eql([
              { name: 'migration1', isTransaction: true },
              { name: 'migration2', isTransaction: false },
              { name: 'migration3', isTransaction: true },
            ])
            expect(transactionSpy.callCount).to.equal(2)
          })

          it('should honor config.transaction when migrating down', async () => {
            const { migrator, executedDownMethods, executedInTransactions } =
              createMigrations(
                [
                  { name: 'migration1', config: { transaction: false } },
                  'migration2',
                ],
                { transactionMode: 'per-migration' },
              )

            await migrator.migrateToLatest()
            executedInTransactions.length = 0

            const { error } = await migrator.migrateTo(NO_MIGRATIONS)

            expect(error).to.be.undefined
            expect(executedDownMethods).to.eql(['migration2', 'migration1'])
            expect(executedInTransactions).to.eql([
              { name: 'migration2', isTransaction: true },
              { name: 'migration1', isTransaction: false },
            ])
          })

          it('should return an error when the migrator is given a transaction', async () => {
            const trx = await ctx.db.startTransaction().execute()

            try {
              const { migrator } = createMigrations(['migration1'], {
                db: trx,
                transactionMode: 'per-migration',
              })

              const { error, results } = await migrator.migrateToLatest()

              expect(getMessage(error)).to.eql(
                "The transaction mode is 'per-migration' but the migrator was given a transaction. Passing a transaction to this migrator is only supported when `transactionMode` is 'per-run'.",
              )
              expect(results).to.be.undefined
            } finally {
              await trx.rollback().execute()
            }
          })

          it('should run a migration with config.transaction true in its own transaction', async () => {
            const { migrator, executedInTransactions } = createMigrations(
              [
                'migration1',
                { name: 'migration2', config: { transaction: true } },
              ],
              { transactionMode: 'per-migration' },
            )

            const { error } = await migrator.migrateToLatest()

            expect(error).to.be.undefined
            expect(executedInTransactions).to.eql([
              { name: 'migration1', isTransaction: true },
              { name: 'migration2', isTransaction: true },
            ])
            expect(transactionSpy.callCount).to.equal(2)
          })
        })

        describe("'per-run'", () => {
          it('should run all migrations in a single transaction', async () => {
            const { migrator, executedInTransactions } = createMigrations(
              ['migration1', 'migration2'],
              { transactionMode: 'per-run' },
            )

            const { error } = await migrator.migrateToLatest()

            expect(error).to.be.undefined
            expect(executedInTransactions).to.eql([
              { name: 'migration1', isTransaction: true },
              { name: 'migration2', isTransaction: true },
            ])
            expect(transactionSpy.callCount).to.equal(1)
          })

          it('should roll back all migrations when a later migration fails', async () => {
            const { migrator, executedUpMethods } = createMigrations(
              ['migration1', { name: 'migration2', error: 'whoopsydaisy' }],
              { transactionMode: 'per-run' },
            )

            const { error, results } = await migrator.migrateToLatest()

            expect(getMessage(error)).to.equal('whoopsydaisy')
            expect(results).to.eql([
              {
                migrationName: 'migration1',
                direction: 'Up',
                status: 'Success',
              },
              { migrationName: 'migration2', direction: 'Up', status: 'Error' },
            ])
            expect(executedUpMethods).to.eql(['migration1'])

            const migrations = await migrator.getMigrations()

            expect(
              migrations.find((it) => it.name === 'migration1')?.executedAt,
            ).to.be.undefined
          })

          it('should return an error when a migration has a transaction configuration', async () => {
            const { migrator, executedUpMethods } = createMigrations(
              [
                'migration1',
                { name: 'migration2', config: { transaction: false } },
              ],
              { transactionMode: 'per-run' },
            )

            const { error, results } = await migrator.migrateToLatest()

            expect(getMessage(error)).to.eql(
              "Migration \"migration2\" has a `transaction` configuration but `transactionMode` is 'per-run'. Per-migration transaction configuration is only supported when `transactionMode` is 'per-migration'. Set `transactionMode: 'per-migration'` on the migrator or the migrate call to enable it.",
            )
            expect(results).to.be.undefined
            expect(executedUpMethods).to.eql([])
          })
        })

        describe('precedence', () => {
          it('should use transactionMode provided in the migrate call', async () => {
            const { migrator, executedInTransactions } = createMigrations([
              'migration1',
              'migration2',
            ])

            const { error } = await migrator.migrateToLatest({
              transactionMode: 'per-migration',
            })

            expect(error).to.be.undefined
            expect(executedInTransactions).to.eql([
              { name: 'migration1', isTransaction: true },
              { name: 'migration2', isTransaction: true },
            ])
            expect(transactionSpy.callCount).to.equal(2)
          })

          it('should let transactionMode in the migrate call override the one on the migrator', async () => {
            const { migrator, executedInTransactions } = createMigrations(
              ['migration1', 'migration2'],
              { transactionMode: 'per-run' },
            )

            const { error } = await migrator.migrateToLatest({
              transactionMode: 'per-migration',
            })

            expect(error).to.be.undefined
            expect(executedInTransactions).to.eql([
              { name: 'migration1', isTransaction: true },
              { name: 'migration2', isTransaction: true },
            ])
            expect(transactionSpy.callCount).to.equal(2)
          })

          it('should let transactionMode in the migrate call override legacy disableTransactions on the migrator', async () => {
            const { migrator, executedInTransactions } = createMigrations(
              ['migration1', 'migration2'],
              { disableTransactions: true },
            )

            const { error } = await migrator.migrateToLatest({
              transactionMode: 'per-migration',
            })

            expect(error).to.be.undefined
            expect(executedInTransactions).to.eql([
              { name: 'migration1', isTransaction: true },
              { name: 'migration2', isTransaction: true },
            ])
          })
        })

        it('should return an error when rolling back a migration with a transaction configuration without transactionMode', async () => {
          const { migrator, executedDownMethods } = createMigrations([
            { name: 'migration1', config: { transaction: false } },
          ])

          const { error: upError } = await migrator.migrateToLatest({
            transactionMode: 'per-migration',
          })

          expect(upError).to.be.undefined

          const { error, results } = await migrator.migrateDown()

          expect(getMessage(error)).to.eql(
            "Migration \"migration1\" has a `transaction` configuration but `transactionMode` was not provided and defaults to 'per-run'. Per-migration transaction configuration is only supported when `transactionMode` is 'per-migration'. Set `transactionMode: 'per-migration'` on the migrator or the migrate call to enable it.",
          )
          expect(results).to.be.undefined
          expect(executedDownMethods).to.eql([])
        })

        it('should return an error when the migrator is given a transaction and transactions are disabled', async () => {
          const migratorConfigs: Partial<MigratorProps>[] = [
            { transactionMode: 'none' },
            { disableTransactions: true },
          ]

          for (const migratorConfig of migratorConfigs) {
            const trx = await ctx.db.startTransaction().execute()

            try {
              const { migrator } = createMigrations(['migration1'], {
                db: trx,
                ...migratorConfig,
              })

              const { error, results } = await migrator.migrateToLatest()

              expect(getMessage(error)).to.eql(
                "The transaction mode is 'none' but the migrator was given a transaction. Passing a transaction to this migrator is only supported when `transactionMode` is 'per-run'.",
              )
              expect(results).to.be.undefined
            } finally {
              await trx.rollback().execute()
            }
          }
        })
      }

      if (sqlSpec === 'mysql' || sqlSpec === 'sqlite') {
        it("should return an error for explicit 'per-run' and 'per-migration' modes due to lack of support for transactional DDL", async () => {
          for (const transactionMode of ['per-run', 'per-migration'] as const) {
            const { migrator, executedUpMethods } = createMigrations(
              ['migration1'],
              { transactionMode },
            )

            const { error, results } = await migrator.migrateToLatest()

            expect(getMessage(error)).to.eql(
              `\`transactionMode\` is '${transactionMode}' but transactional DDL is not supported in this dialect. Migrations would fail or behave unexpectedly.`,
            )
            expect(results).to.be.undefined
            expect(executedUpMethods).to.eql([])
          }
        })
      }

      describe("'none'", () => {
        it('should not use transactions', async () => {
          const { migrator, executedInTransactions } = createMigrations(
            ['migration1', 'migration2'],
            { transactionMode: 'none' },
          )

          const { error } = await migrator.migrateToLatest()

          expect(error).to.be.undefined
          expect(executedInTransactions).to.eql([
            { name: 'migration1', isTransaction: false },
            { name: 'migration2', isTransaction: false },
          ])
          expect(transactionSpy.called).to.be.false
        })

        it('should return an error when a migration has a transaction configuration', async () => {
          const { migrator, executedUpMethods } = createMigrations(
            [{ name: 'migration1', config: { transaction: true } }],
            { transactionMode: 'none' },
          )

          const { error, results } = await migrator.migrateToLatest()

          expect(getMessage(error)).to.eql(
            "Migration \"migration1\" has a `transaction` configuration but `transactionMode` is 'none'. Per-migration transaction configuration is only supported when `transactionMode` is 'per-migration'. Set `transactionMode: 'per-migration'` on the migrator or the migrate call to enable it.",
          )
          expect(results).to.be.undefined
          expect(executedUpMethods).to.eql([])
        })

        it('should return an error when a migration has a transaction configuration and legacy disableTransactions is true', async () => {
          const { migrator, executedUpMethods } = createMigrations(
            [{ name: 'migration1', config: { transaction: false } }],
            { disableTransactions: true },
          )

          const { error, results } = await migrator.migrateToLatest()

          expect(getMessage(error)).to.eql(
            "Migration \"migration1\" has a `transaction` configuration but `transactionMode` is 'none'. Per-migration transaction configuration is only supported when `transactionMode` is 'per-migration'. Set `transactionMode: 'per-migration'` on the migrator or the migrate call to enable it.",
          )
          expect(results).to.be.undefined
          expect(executedUpMethods).to.eql([])
        })
      })

      it('should return an error when a migration has a transaction configuration and no transactionMode was provided', async () => {
        const defaultMode =
          sqlSpec === 'postgres' || sqlSpec === 'mssql' ? 'per-run' : 'none'

        const { migrator, executedUpMethods } = createMigrations([
          { name: 'migration1', config: { transaction: false } },
        ])

        const { error, results } = await migrator.migrateToLatest()

        expect(getMessage(error)).to.eql(
          `Migration "migration1" has a \`transaction\` configuration but \`transactionMode\` was not provided and defaults to '${defaultMode}'. Per-migration transaction configuration is only supported when \`transactionMode\` is 'per-migration'. Set \`transactionMode: 'per-migration'\` on the migrator or the migrate call to enable it.`,
        )
        expect(results).to.be.undefined
        expect(executedUpMethods).to.eql([])
      })

      it('should return an error when transactionMode and disableTransactions contradict each other', async () => {
        const { migrator, executedUpMethods } = createMigrations(
          ['migration1'],
          {
            disableTransactions: true,
            transactionMode: 'per-run',
          },
        )

        const { error, results } = await migrator.migrateToLatest()

        expect(getMessage(error)).to.eql(
          "`transactionMode` is 'per-run' but `disableTransactions` is true in the migrator properties. These options contradict each other. Prefer `transactionMode` — `disableTransactions` is deprecated.",
        )
        expect(results).to.be.undefined
        expect(executedUpMethods).to.eql([])

        const { error: callError } = await migrator.migrateToLatest({
          disableTransactions: false,
          transactionMode: 'none',
        })

        expect(getMessage(callError)).to.eql(
          "`transactionMode` is 'none' but `disableTransactions` is false in the migrate call options. These options contradict each other. Prefer `transactionMode` — `disableTransactions` is deprecated.",
        )
      })
    })

    describe('migrateDown', () => {
      it('should migrate down one step', async () => {
        const { migrator, executedUpMethods, executedDownMethods } =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        await migrator.migrateUp()
        await migrator.migrateUp()

        const { results: results1 } = await migrator.migrateDown()
        const { results: results2 } = await migrator.migrateDown()
        const { results: results3 } = await migrator.migrateDown()

        expect(results1).to.eql([
          { migrationName: 'migration2', direction: 'Down', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration1', direction: 'Down', status: 'Success' },
        ])

        expect(results3).to.eql([])

        expect(executedUpMethods).to.eql(['migration1', 'migration2'])
        expect(executedDownMethods).to.eql(['migration2', 'migration1'])
      })

      it('should return an error if a new migration is added before the last executed one', async () => {
        const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
          createMigrations(['migration1', 'migration3'])

        await migrator1.migrateToLatest()

        const {
          migrator: migrator2,
          executedUpMethods: _executedUpMethods2,
          executedDownMethods: executedDownMethods2,
        } = createMigrations(['migration1', 'migration2', 'migration3'])

        const { error } = await migrator2.migrateDown()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: expected previously executed migration migration3 to be at index 1 but migration2 was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.',
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedDownMethods2).to.eql([])
      })

      it('should migrate down one step with allowUnorderedMigrations enabled', async () => {
        const {
          migrator: migrator1,
          executedUpMethods: executedUpMethods1,
          executedDownMethods: _executedDownMethods1,
        } = createMigrations(['migration1', 'migration2', 'migration4'], {
          allowUnorderedMigrations: true,
        })

        await migrator1.migrateToLatest()

        const {
          migrator: migrator2,
          executedUpMethods: _executedUpMethods2,
          executedDownMethods: executedDownMethods2,
        } = createMigrations(
          [
            'migration1',
            'migration2',
            'migration3',
            'migration4',
            'migration5',
          ],
          { allowUnorderedMigrations: true },
        )

        const { results: results1 } = await migrator2.migrateDown()
        const { results: results2 } = await migrator2.migrateDown()
        const { results: results3 } = await migrator2.migrateDown()
        const { results: results4 } = await migrator2.migrateDown()

        expect(results1).to.eql([
          { migrationName: 'migration4', direction: 'Down', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Down', status: 'Success' },
        ])

        expect(results3).to.eql([
          { migrationName: 'migration1', direction: 'Down', status: 'Success' },
        ])

        expect(results4).to.eql([])

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration4',
        ])
        expect(executedDownMethods2).to.eql([
          'migration4',
          'migration2',
          'migration1',
        ])
      })

      describe('Migrate up should work when timestamps are equal', () => {
        let originalToIsoString: typeof Date.prototype.toISOString

        before(() => {
          originalToIsoString = Date.prototype.toISOString
          const defaultDateIsoString = new Date(2024, 0, 11).toISOString()
          Date.prototype.toISOString = () => defaultDateIsoString
        })

        after(() => {
          Date.prototype.toISOString = originalToIsoString
        })

        it('should use the same ordering strategy for migrations for both not executed migrations and executed migrations', async () => {
          const { migrator: migrator1, executedUpMethods: executedUpMethods1 } =
            createMigrations([
              '2024-01-01-create-table',
              '2024-01-01.2-update-table',
            ])

          await migrator1.migrateToLatest()

          const { migrator: migrator2, executedUpMethods: executedUpMethods2 } =
            createMigrations([
              '2024-01-01-create-table',
              '2024-01-01.2-update-table',
            ])

          const { results: results2, error } = await migrator2.migrateToLatest()
          expect(error).to.be.undefined
          expect(results2).to.eql([])

          expect(executedUpMethods1).to.eql([
            '2024-01-01-create-table',
            '2024-01-01.2-update-table',
          ])
          expect(executedUpMethods2).to.eql([])
        })
      })
    })

    if (sqlSpec === 'postgres' || sqlSpec === 'mssql') {
      describe('custom migration tables in a custom schema', () => {
        it('should create custom migration tables in custom schema', async () => {
          const { migrator, executedUpMethods } = createMigrations(
            ['migration1', 'migration2', 'migration3', 'migration4'],
            {
              migrationTableName: CUSTOM_MIGRATION_TABLE,
              migrationLockTableName: CUSTOM_MIGRATION_LOCK_TABLE,
              migrationTableSchema: CUSTOM_MIGRATION_SCHEMA,
            },
          )

          let promises: Promise<MigrationResultSet>[] = []
          // Run the migration 20 times in parallel to make sure the schema
          // related code can be run in parallel.
          for (let i = 0; i < 20; ++i) {
            promises.push(migrator.migrateTo('migration2'))
          }
          const results = await Promise.all(promises)
          for (const result of results) {
            expect(result.error).to.equal(undefined)
          }

          expect(executedUpMethods).to.eql(['migration1', 'migration2'])

          expect(
            await doesTableExists(
              CUSTOM_MIGRATION_LOCK_TABLE,
              CUSTOM_MIGRATION_SCHEMA,
            ),
          ).to.equal(true)

          expect(
            await doesTableExists(
              CUSTOM_MIGRATION_LOCK_TABLE,
              CUSTOM_MIGRATION_SCHEMA,
            ),
          ).to.equal(true)

          expect(await doesTableExists(DEFAULT_MIGRATION_TABLE)).to.equal(false)
          expect(await doesTableExists(DEFAULT_MIGRATION_LOCK_TABLE)).to.equal(
            false,
          )
        })
      })
    }

    async function deleteMigrationTables(): Promise<void> {
      if (sqlSpec !== 'sqlite') {
        await ctx.db.schema
          .withSchema(CUSTOM_MIGRATION_SCHEMA)
          .dropTable(CUSTOM_MIGRATION_TABLE)
          .ifExists()
          .execute()

        await ctx.db.schema
          .withSchema(CUSTOM_MIGRATION_SCHEMA)
          .dropTable(CUSTOM_MIGRATION_LOCK_TABLE)
          .ifExists()
          .execute()

        await ctx.db.schema
          .dropSchema(CUSTOM_MIGRATION_SCHEMA)
          .ifExists()
          .execute()
      }

      await ctx.db.schema
        .dropTable(DEFAULT_MIGRATION_TABLE)
        .ifExists()
        .execute()

      await ctx.db.schema
        .dropTable(DEFAULT_MIGRATION_LOCK_TABLE)
        .ifExists()
        .execute()
    }

    function createMigrations(
      migrationConfigs: (
        | string
        | {
            config?: MigrationConfig
            durationMs?: number
            name: string
            error?: string
            preUp?: () => void
          }
      )[],
      migratorConfig?: Partial<MigratorProps>,
    ): {
      migrator: Migrator
      executedUpMethods: string[]
      executedDownMethods: string[]
      executedInTransactions: { name: string; isTransaction: boolean }[]
    } {
      const executedUpMethods: string[] = []
      const executedDownMethods: string[] = []
      const executedInTransactions: {
        name: string
        isTransaction: boolean
      }[] = []

      const migrations = migrationConfigs.reduce<Record<string, Migration>>(
        (migrations, rawConfig) => {
          const migrationEntry: {
            config?: MigrationConfig
            durationMs: number
            name: string
            error?: string
            preUp?: () => void
          } =
            typeof rawConfig === 'string'
              ? { durationMs: 20, name: rawConfig }
              : { durationMs: 20, ...rawConfig }

          return {
            ...migrations,
            [migrationEntry.name]: {
              async up(db): Promise<void> {
                migrationEntry.preUp?.()
                await setTimeout(migrationEntry.durationMs)

                if (migrationEntry.error) {
                  throw new Error(migrationEntry.error)
                }

                executedInTransactions.push({
                  name: migrationEntry.name,
                  isTransaction: db.isTransaction,
                })

                executedUpMethods.push(migrationEntry.name)
              },

              async down(db): Promise<void> {
                await setTimeout(migrationEntry.durationMs)

                if (migrationEntry.error) {
                  throw new Error(migrationEntry.error)
                }

                executedInTransactions.push({
                  name: migrationEntry.name,
                  isTransaction: db.isTransaction,
                })

                executedDownMethods.push(migrationEntry.name)
              },

              config: migrationEntry.config,
            },
          }
        },
        {},
      )

      return {
        migrator: new Migrator({
          db: ctx.db,
          provider: {
            getMigrations: () => Promise.resolve(migrations),
          },
          ...migratorConfig,
        }),
        executedUpMethods,
        executedDownMethods,
        executedInTransactions,
      }
    }

    async function doesTableExists(
      tableName: string,
      schema?: string,
    ): Promise<boolean> {
      const tables = await ctx.db.introspection.getTables()
      return !!tables.find(
        (it) => it.name === tableName && (!schema || it.schema === schema),
      )
    }
  })
}

function getMessage(obj: unknown): string | undefined {
  if (isObject(obj) && typeof obj.message === 'string') {
    return obj.message
  }
}

function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null
}

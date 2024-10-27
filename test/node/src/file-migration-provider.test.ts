import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { require as tsxRequire } from 'tsx/cjs/api'
import { FileMigrationProvider } from '../../..'
import { expect } from './test-setup.js'

describe('FileMigrationProvider', () => {
  ;['js', 'ts', 'mjs', 'cjs', 'mts', 'cts'].forEach((extension) => {
    describe(`${extension} files`, () => {
      const migrationFolder = `${extension}-migrations`
      const migrationFolderPath = join(__dirname, migrationFolder)
      let provider: FileMigrationProvider
      const migrationName = '123_noop'

      before(async () => {
        await mkdir(migrationFolderPath)
        await writeFile(
          join(migrationFolderPath, `${migrationName}.${extension}`),
          extension.endsWith('js')
            ? 'exports.up = () => {}'
            : 'export const up = () => {}',
        )

        provider = new FileMigrationProvider({
          fs: { readdir },
          import:
            extension.endsWith('ts') || extension.startsWith('m')
              ? (module: string) => tsxRequire(module, __filename)
              : undefined,
          migrationFolder: migrationFolderPath,
          path: { join },
        })
      })

      after(async () => {
        await rm(migrationFolderPath, { recursive: true })
      })

      it('should get migration files with this extension', async () => {
        const migrations = await provider.getMigrations()

        expect(migrations).to.have.property(migrationName)
      })
    })
  })
  //
  ;['zip', 'd.ts', 'd.mts', 'd.cts'].forEach((extension) => {
    describe(`${extension} files`, () => {
      const migrationFolder = `${extension}-migrations`
      const migrationFolderPath = join(__dirname, migrationFolder)
      let provider: FileMigrationProvider
      const migrationFileName = `123_noop.${extension}`
      let discarded: { fileName: string; reason: string }[]

      before(async () => {
        await mkdir(migrationFolderPath)
        await writeFile(
          join(migrationFolderPath, migrationFileName),
          extension.endsWith('ts') ? 'export {}' : '==asdhjgbaudg1827dg127',
        )
        discarded = []

        provider = new FileMigrationProvider({
          fs: { readdir },
          migrationFolder: migrationFolderPath,
          onDiscarded: (fileName, reason) => {
            discarded.push({ fileName, reason })
          },
          path: { join },
        })
      })

      after(async () => {
        await rm(migrationFolderPath, { recursive: true })
      })

      it('should discard files with this extension', async () => {
        const migrations = await provider.getMigrations()

        expect(migrations).to.deep.equal({})
        expect(discarded).to.have.length(1)
        expect(discarded[0]).to.deep.equal({
          fileName: migrationFileName,
          reason: 'Extension',
        })
      })
    })
  })
})

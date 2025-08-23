import { unlink } from 'node:fs/promises'
import { dirname, resolve } from 'pathe'
import { readPackageJSON, readTSConfig, writeTSConfig } from 'pkg-types'
import { lt } from 'semver'

const { devDependencies } = await readPackageJSON()

const typescriptVersion = devDependencies!.typescript.replace(/^[~^]/, '')

console.log('typescriptVersion', typescriptVersion)

if (lt(typescriptVersion, '5.2.0')) {
  const tsconfigPath = resolve(
    dirname(new URL(import.meta.url).pathname),
    '../test/node/tsconfig.json',
  )

  const tsconfig = await readTSConfig(tsconfigPath)

  const updatedTSConfig = {
    ...tsconfig,
    // `using` keyword support was only added in 5.2.0
    exclude: (tsconfig.exclude || []).concat('src/async-dispose.test.ts'),
  }

  await writeTSConfig(tsconfigPath, updatedTSConfig)

  console.log(
    `Updated ${tsconfigPath} to exclude async-dispose.test.ts`,
    JSON.stringify(updatedTSConfig, null, 2),
  )
}

if (lt(typescriptVersion, '5.4.0')) {
  // inference from generics was only fixed in 5.4.0, before that you had to explicitly pass type arguments, and the inferred results were wider.
  const typingsTestFilePath = resolve(
    dirname(new URL(import.meta.url).pathname),
    '../test/typings/test-d/generic.test-d.ts',
  )

  await unlink(typingsTestFilePath)

  console.log(`Deleted ${typingsTestFilePath}`)
}

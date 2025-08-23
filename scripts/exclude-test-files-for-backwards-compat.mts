import { dirname, resolve } from 'pathe'
import { readPackageJSON, readTSConfig, writeTSConfig } from 'pkg-types'
import { lt } from 'semver'

const { devDependencies } = await readPackageJSON()

const typescriptVersion = devDependencies!.typescript.replace(/^[~^]/, '')
const testTsConfigRelativePath = '../test/node/tsconfig.json'

console.log('typescriptVersion', typescriptVersion)

if (lt(typescriptVersion, '5.0.0')) {
  const tsconfigPath = resolve(
    dirname(new URL(import.meta.url).pathname),
    testTsConfigRelativePath,
  )

  const tsconfig = await readTSConfig(tsconfigPath)

  const updatedTSConfig = {
    ...tsconfig,
    exclude: (tsconfig.exclude || []).concat('src/async-dispose.test.ts'),
  }

  await writeTSConfig(tsconfigPath, updatedTSConfig)

  console.log(
    `Updated ${tsconfigPath} to exclude async-dispose.test.ts`,
    JSON.stringify(updatedTSConfig, null, 2),
  )
}

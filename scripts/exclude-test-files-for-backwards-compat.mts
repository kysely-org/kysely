import { dirname, resolve } from 'pathe'
import { readTSConfig, writeTSConfig } from 'pkg-types'
import { lt } from 'semver'
import { devDependencies } from '../package.json'

const typescriptVersion = devDependencies.typescript.replace(/^[~^]/, '')
const testTsConfigRelativePath = '../test/node/tsconfig.json'

console.log('typescriptVersion', typescriptVersion)

if (lt(typescriptVersion, '5.0.0')) {
  const tsconfigPath = resolve(
    dirname(new URL(import.meta.url).pathname),
    testTsConfigRelativePath,
  )

  const tsconfig = await readTSConfig(tsconfigPath)

  await writeTSConfig(tsconfigPath, {
    ...tsconfig,
    exclude: (tsconfig.exclude || []).concat('src/async-dispose.test.ts'),
  })

  console.log(`Updated ${tsconfigPath} to exclude async-dispose.test.ts`)
}

if (lt(typescriptVersion, '5.4.0')) {
  // Swap to the pre-5.4 version of the generic test
  const tsdTsConfigPath = resolve(
    dirname(new URL(import.meta.url).pathname),
    '../test/typings/tsconfig.json',
  )

  const tsdTsConfig = await readTSConfig(tsdTsConfigPath)

  const exclude = tsdTsConfig.exclude || []

  const indexForReplacement = exclude.indexOf(
    'test-d/generic-pre-5.4.test-d.ts',
  )

  exclude[indexForReplacement !== -1 ? indexForReplacement : exclude.length] =
    'test-d/generic.test-d.ts'

  await writeTSConfig(tsdTsConfigPath, { ...tsdTsConfig, exclude })

  console.log(
    `Updated ${tsdTsConfigPath} to include generic-pre-5.4.test-d.ts and exclude generic.test-d.ts`,
  )
}

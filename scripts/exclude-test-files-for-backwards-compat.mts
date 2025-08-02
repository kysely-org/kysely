import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'pathe'
import { lt } from 'semver'
import { devDependencies } from '../package.json'

const typescriptVersion = devDependencies.typescript.replace('^', '')
const testTsConfigRelativePath = '../test/node/tsconfig.json'

if (lt(typescriptVersion, '5.0.0')) {
  const tsconfig = await import('../test/node/tsconfig.json')

  await writeFile(
    resolve(
      dirname(new URL(import.meta.url).pathname),
      testTsConfigRelativePath,
    ),
    JSON.stringify({
      ...tsconfig,
      // @ts-ignore
      exclude: [...(tsconfig.exclude || []), 'src/async-dispose.test.ts'],
    }),
  )
}

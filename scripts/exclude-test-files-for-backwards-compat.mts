import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'pathe'
import { lt } from 'semver'
import { devDependencies } from '../package.json'

if (lt(devDependencies.typescript.replace('^', ''), '5.0.0')) {
  const testTsConfigRelativePath = '../test/node/tsconfig.json'

  const tsconfig = await import('../test/node/tsconfig.json')

  await writeFile(
    resolve(
      dirname(new URL(import.meta.url).pathname),
      testTsConfigRelativePath,
    ),
    JSON.stringify({
      ...tsconfig,
      exclude: [...(tsconfig.exclude || []), 'src/async-dispose.test.ts'],
    }),
  )
}

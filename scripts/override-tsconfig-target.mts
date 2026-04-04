import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import { lt } from 'semver'
import packageJson from '../package.json'
import tsconfig from '../tsconfig-base.json'

const __dirname = dirname(fileURLToPath(import.meta.url))

// <=5.4.0 supports target <= es2022.
if (lt(packageJson.devDependencies.typescript.replace(/^[~^]/, ''), '5.5.0')) {
  const { compilerOptions } = tsconfig

  const originalTarget = compilerOptions.target

  compilerOptions.target = 'es2022'

  await writeFile(
    join(__dirname, '../tsconfig-base.json'),
    JSON.stringify(tsconfig),
    { encoding: 'utf8' },
  )

  console.log(`tsconfig-base.json: target:${originalTarget}->target:es2022`)
}

import { dirname, join, resolve } from 'node:path'
import { copyFile, cp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// @ts-expect-error
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const testNodeModulesPath = resolve(__dirname, `../node_modules/kysely`)
const rootPath = resolve(__dirname, '../../../')

Promise.all([
  copyFile(
    join(rootPath, './package.json'),
    join(testNodeModulesPath, './package.json'),
  ),
  cp(join(rootPath, './dist'), join(testNodeModulesPath, './dist'), {
    force: true,
    recursive: true,
  }),
]).then(() => console.log('Copy complete!'))

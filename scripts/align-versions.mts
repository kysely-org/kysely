/**
 * This script aligns docs site package.json AND jsr versions with
 * Kysely's version so we use only the latest published version in the docs and JSR publish.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import jsrJson from '../jsr.json' with { type: 'json' }
import pkgJson from '../package.json' with { type: 'json' }
import sitePkgJson from '../site/package.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const { version } = pkgJson

const readmePath = join(__dirname, '../README.md')

const readmeContent = await readFile(readmePath, { encoding: 'utf8' })

await Promise.all([
  writeFile(
    join(__dirname, '../site/package.json'),
    JSON.stringify({ ...sitePkgJson, version }, null, 2) + '\n',
  ),
  writeFile(
    join(__dirname, '../jsr.json'),
    JSON.stringify({ ...jsrJson, version }, null, 2) + '\n',
  ),
  writeFile(
    readmePath,
    readmeContent.replace(
      /([^\d]?)\d{1,2}\.\d{1,2}\.\d{1,2}([^\d]?)/g,
      `$1${version}$2`,
    ),
  ),
])

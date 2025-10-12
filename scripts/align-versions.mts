/**
 * This script aligns docs site package.json AND jsr versions with
 * Kysely's version so we use only the latest published version in the docs and JSR publish.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import jsrJson from '../jsr.json' with { type: 'json' }
import pkgJson from '../package.json' with { type: 'json' }
import sitePkgJson from '../site/package.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const { version } = pkgJson

writeFileSync(
  join(__dirname, '../site/package.json'),
  JSON.stringify({ ...sitePkgJson, version }, null, 2) + '\n',
)

writeFileSync(
  join(__dirname, '../jsr.json'),
  JSON.stringify({ ...jsrJson, version }, null, 2) + '\n',
)

/**
 * This script aligns docusaurus package.json & package-lock.json versions with
 * Kysely's version so we use only the latest published version in the docs.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import pkgJson from '../package.json' with { type: 'json' }
import sitePkgJson from '../site/package.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const sitePath = join(__dirname, '..', 'site')

console.log(__dirname)
console.log(sitePath)

writeFileSync(
  join(sitePath, 'package.json'),
  JSON.stringify({ ...sitePkgJson, version: pkgJson.version }, null, 2) + '\n',
)

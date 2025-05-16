/**
 * This script aligns `jsr.json` and docs site's `package.json` & `package-lock.json` versions with
 * the main `package.json` version.
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as jsrJson from '../jsr.json' with { type: 'json' }
import * as sitePackageJson from '../site/package.json' with { type: 'json' }
import * as sitePackageLockJson from '../site/package-lock.json' with { type: 'json' }
import * as pkgJson from '../package.json' with { type: 'json' }

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const sitePath = join(__dirname, '../site')

const { version } = (pkgJson as unknown as { default: typeof pkgJson }).default

writeFileSync(
  join(sitePath, 'package.json'),
  JSON.stringify({ ...sitePackageJson.default, version }, null, 2) + '\n',
)

writeFileSync(
  join(sitePath, 'package-lock.json'),
  JSON.stringify({ ...sitePackageLockJson.default, version }, null, 2) + '\n',
)

writeFileSync(
  join(__dirname, '../jsr.json'),
  JSON.stringify({ ...jsrJson.default, version }, null, 2) + '\n',
)

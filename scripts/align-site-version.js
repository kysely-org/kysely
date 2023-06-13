/**
 * This script aligns docusaurus package.json & package-lock.json versions with
 * Kysely's version so we use only the latest published version in the docs.
 */

const { version } = require('../package.json')
const sitePackageJson = require('../site/package.json')
const sitePackageLockJson = require('../site/package-lock.json')
const { writeFileSync } = require('fs')
const { join } = require('path')

const sitePath = join(__dirname, '..', 'site')

writeFileSync(
  join(sitePath, 'package.json'),
  JSON.stringify({ ...sitePackageJson, version }, null, 2) + '\n'
)
writeFileSync(
  join(sitePath, 'package-lock.json'),
  JSON.stringify({ ...sitePackageLockJson, version }, null, 2) + '\n'
)

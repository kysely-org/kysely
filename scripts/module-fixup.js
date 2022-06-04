/**
 * Adds a package.json file to both commonjs and ESM distribution
 * folders with a correct module type. This is needed in order to
 * be able to export both commonjs and ESM versions.
 */

const fs = require('fs')
const path = require('path')

const DIST_PATH = path.join(__dirname, '..', 'dist')

fs.writeFileSync(
  path.join(DIST_PATH, 'cjs', 'package.json'),
  JSON.stringify({ type: 'commonjs', sideEffects: false })
)

fs.writeFileSync(
  path.join(DIST_PATH, 'esm', 'package.json'),
  JSON.stringify({ type: 'module', sideEffects: false })
)

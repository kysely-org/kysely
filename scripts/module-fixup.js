/**
 * Adds a package.json file to both commonjs and ESM distribution
 * folders with a correct module type. This is needed in order to
 * be able to export both commonjs and ESM versions.
 *
 * This script also creates a dummy files for all `exports` in the
 * package.json to make CJS happy.
 */

const fs = require('fs')
const path = require('path')
const package = require('../package.json')

const ROOT_PATH = path.join(__dirname, '..')
const DIST_PATH = path.join(ROOT_PATH, 'dist')

for (const [folder, type] of [
  ['cjs', 'commonjs'],
  ['esm', 'module'],
]) {
  fs.writeFileSync(
    path.join(DIST_PATH, folder, 'package.json'),
    JSON.stringify({ type, sideEffects: false })
  )
}

for (const ex of Object.keys(package.exports)) {
  if (ex === '.') {
    continue
  }

  const [, ...folders] = ex.split('/')
  const fileName = folders.pop()

  const [, ...targetFolders] = package.exports[ex].require.split('/')
  const targetFileName = targetFolders.pop()
  const target = path.posix.relative(
    path.posix.join(ROOT_PATH, ...folders),
    path.posix.join(ROOT_PATH, ...targetFolders, targetFileName)
  )

  fs.mkdirSync(path.join(ROOT_PATH, ...folders), {
    recursive: true,
  })

  fs.writeFileSync(
    path.join(ROOT_PATH, ...folders, fileName + '.js'),
    `module.exports = require('${target}')`
  )

  fs.writeFileSync(
    path.join(ROOT_PATH, ...folders, fileName + '.d.ts'),
    `export * from '${target}'`
  )
}

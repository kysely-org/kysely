/**
 * This script ensures all files in a path are exported in the index.ts file.
 * For now it only checks the operation-node folder, as we've had issues with
 * missing exports there.
 */

const fs = require('node:fs')
const path = require('node:path')
const forEachFile = require('./util/for-each-file')

let errorsFound = false

function checkExports(dir) {
  const indexFileContents = fs.readFileSync(
    path.join(__dirname, '..', 'src/index.ts'),
    'utf-8',
  )

  forEachFile(dir, (filePath) => {
    if (filePath.endsWith('.ts')) {
      const expectedExportPath = filePath.replace(
        /^.+\/src\/(.+)\.ts$/,
        "'./$1.js'",
      )

      if (!indexFileContents.includes(expectedExportPath)) {
        console.log(`Missing export: ${expectedExportPath}`)
        errorsFound = true
      }
    }
  })
}

checkExports(path.join(__dirname, '..', 'src/operation-node'))

if (errorsFound) {
  console.log(' ')
  console.log('check-exports.js failed!')
  process.exit(1)
}

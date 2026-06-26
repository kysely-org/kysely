/**
 * This scripts adds a `/// <reference types="./file.d.ts" />` directive
 * at the beginning of each ESM JavaScript file so that they work with
 * deno.
 */

const fs = require('fs')
const path = require('pathe')
const forEachFile = require('./util/for-each-file.cjs')

const DIST_PATH = path.join(__dirname, '..', 'dist')

forEachFile(DIST_PATH, (filePath) => {
  if (filePath.endsWith('.js')) {
    const dTsFile = path.basename(filePath).replace(/\.js$/, '.d.ts')
    const content = fs.readFileSync(filePath, { encoding: 'utf-8' })

    fs.writeFileSync(
      filePath,
      `/// <reference types="./${dTsFile}" />\n${content}`,
    )
  }
})

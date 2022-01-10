/**
 * This script goes through all source files and makes sure
 * imports end with '.js'. If they don't, the ESM version will
 * not work. ESM imports must have the full file name.
 */

const fs = require('fs')
const path = require('path')
const forEachFile = require('./util/for-each-file')

let errorsFound = false

function checkDir(dir) {
  forEachFile(dir, (filePath) => {
    let errorsFoundInFile = false

    if (filePath.endsWith('.ts')) {
      for (const row of readLines(filePath)) {
        if (isLocalImport(row) && !isDotJsImport(row)) {
          if (!errorsFoundInFile) {
            if (errorsFound) {
              console.log(' ')
            }

            console.log(`invalid imports in file ${filePath}`)
            errorsFoundInFile = true
          }

          console.log(row)
          errorsFound = true
        }
      }
    }
  })
}

function readLines(filePath) {
  const data = fs.readFileSync(filePath).toString('utf-8')
  return data.split('\n')
}

function isLocalImport(row) {
  return row.includes("from '.") || row.includes('from ".')
}

function isDotJsImport(row) {
  return row.endsWith(".js'")
}

checkDir(path.join(__dirname, '..', 'src'))

if (errorsFound) {
  console.log(' ')
  console.log('check-esm-imports.js failed!')
  process.exit(1)
}

const fs = require('fs')
const path = require('path')

let errorsFound = false

function checkFolder(folder) {
  for (const file of fs.readdirSync(folder)) {
    let errorsFoundInFile = false

    if (file === '.' || file === '..') {
      continue
    }

    const filePath = path.join(folder, file)

    if (isDir(filePath)) {
      checkFolder(filePath)
    } else if (file.endsWith('.ts')) {
      for (const row of fs.readFileSync(filePath).toString().split('\n')) {
        if (row.includes("from '.") && !row.endsWith(".js'")) {
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
  }
}

function isDir(file) {
  return fs.lstatSync(file).isDirectory()
}

checkFolder(path.join(__dirname, 'src'))

if (errorsFound) {
  console.log(' ')
  console.log('check-esm-imports.js failed!')
  process.exit(1)
}

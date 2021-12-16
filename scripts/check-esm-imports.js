const fs = require('fs')
const path = require('path')

let errorsFound = false

function checkDir(dir) {
  const files = fs.readdirSync(dir).filter((it) => it !== '.' && it !== '..')

  for (const file of files) {
    const filePath = path.join(dir, file)
    let errorsFoundInFile = false

    if (isDir(filePath)) {
      checkDir(filePath)
    } else if (file.endsWith('.ts')) {
      for (const row of fs.readFileSync(filePath).toString().split('\n')) {
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
  }
}

function isDir(file) {
  return fs.lstatSync(file).isDirectory()
}

function isLocalImport(row) {
  return row.includes("from '.")
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

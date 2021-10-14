const fs = require('fs')
const path = require('path')

let errorsFound = false

function checkFolder(folder) {
  for (const file of fs.readdirSync(folder)) {
    if (file === '.' || file === '..') {
      continue
    }

    const filePath = path.join(folder, file)

    if (isDir(filePath)) {
      checkFolder(filePath)
    }

    if (file.endsWith('.ts')) {
      for (const row of fs.readFileSync(filePath).toString().split('\n')) {
        if (row.includes("from '.") && !row.endsWith(".js'")) {
          console.log(`invalid import in file ${filePath}`)
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
  process.exit(1)
}

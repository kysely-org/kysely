const fs = require('fs')
const path = require('path')

function forEachFile(dir, callback) {
  const files = fs.readdirSync(dir).filter((it) => it !== '.' && it !== '..')

  for (const file of files) {
    const filePath = path.join(dir, file)

    if (isDir(filePath)) {
      forEachFile(filePath, callback)
    } else {
      callback(filePath)
    }
  }
}

function isDir(file) {
  return fs.lstatSync(file).isDirectory()
}

module.exports = forEachFile

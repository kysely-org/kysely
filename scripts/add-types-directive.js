const path = require('path')
const fs = require('fs').promises

const out = path.join(__dirname, '../dist/esm')

async function main() {
  const files = await getFiles(out)
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const dTsFile = file.replace(/\.js$/, '.d.ts')
    if (file.endsWith('.js') && files.includes(dTsFile)) {
      const baseName = path.basename(file).replace(/\.js$/, '.d.ts')
      const content = await fs.readFile(file, 'utf8')
      const newContent = `/// <reference types="./${baseName}" />\n` + content
      await fs.writeFile(file, newContent)
      console.log(`Updated ${file}`)
    }
  }
}

main()

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}

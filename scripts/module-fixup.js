const fs = require('fs')
const path = require('path')

const DIST_PATH = path.join(__dirname, '..', 'dist')

fs.writeFileSync(
  path.join(DIST_PATH, 'cjs', 'package.json'),
  JSON.stringify({ type: 'commonjs' })
)

fs.writeFileSync(
  path.join(DIST_PATH, 'esm', 'package.json'),
  JSON.stringify({ type: 'module' })
)

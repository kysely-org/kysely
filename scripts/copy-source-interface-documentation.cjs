/**
 * Copies shared interface documentation into TypeScript source and extends it
 * with local @remarks, using the same rules as the declaration copier.
 *
 * The default output is a separate source tree under dist/source. Use that tree
 * as the entry point for source documentation tools. Release/docs checkouts can
 * use --in-place before publishing to JSR or running TypeDoc against src.
 */
const fs = require('node:fs')
const path = require('node:path')
const {
  copyInterfaceDocumentation,
} = require('./util/copy-interface-documentation.cjs')

const source = path.join(__dirname, '..', 'src')
const args = process.argv.slice(2)
if (
  args.length > 1 ||
  (args[0]?.startsWith('--') && args[0] !== '--in-place')
) {
  throw new Error(
    'Usage: copy-source-interface-documentation.cjs [output-directory | --in-place]',
  )
}
const output =
  args[0] === '--in-place'
    ? source
    : path.resolve(args[0] ?? path.join(__dirname, '..', 'dist', 'source'))
if (output !== source) {
  if (
    source.startsWith(output + path.sep) ||
    output.startsWith(source + path.sep)
  ) {
    throw new Error('The output directory must be outside src')
  }
  fs.cpSync(source, output, { recursive: true })
}
const lineMappings = copyInterfaceDocumentation(output)
if (args[0] === '--in-place' && Object.keys(lineMappings).length) {
  // TypeDoc's postprocessor uses this to retain links to authored source lines.
  const mappingPath = path.join(
    __dirname,
    '..',
    'dist',
    'source-documentation-lines.json',
  )
  fs.mkdirSync(path.dirname(mappingPath), { recursive: true })
  fs.writeFileSync(mappingPath, JSON.stringify(lineMappings) + '\n')
}

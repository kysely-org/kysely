/**
 * Copies shared interface documentation into generated declarations and extends
 * it with local @remarks. Run as part of the build after TypeScript compilation.
 */
const path = require('node:path')
const {
  copyInterfaceDocumentation,
} = require('./util/copy-interface-documentation.cjs')

copyInterfaceDocumentation(path.join(__dirname, '..', 'dist'))

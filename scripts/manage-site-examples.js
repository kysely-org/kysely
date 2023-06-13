/**
 * Manage website's example files:
 *
 *   node manage-site-examples.js add select 5 "The name of the example"
 *   node manage-site-examples.js remove select 5
 *
 */
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const cmd = process.argv[2]
if (cmd !== 'add' && cmd !== 'remove') {
  console.error('first argument must be the command (add | remove)')
  process.exit(1)
}

const section = process.argv[3]
if (!section) {
  console.error('second argument must be the example section')
  process.exit(1)
}

const index = parseInt(process.argv[4])
if (!index) {
  console.error('third argument must be the example index in the section')
  process.exit(1)
}

const name = process.argv[5]
if (cmd === 'add' && !name) {
  console.error('fourth argument must be the name of the example')
  process.exit(1)
}

const examplesDir = path.join(
  __dirname,
  '..',
  'site',
  'docs',
  'examples',
  section.toUpperCase()
)

const examples = fs
  .readdirSync(examplesDir)
  .sort()
  .map((e) => e.split('-'))
  .filter((e) => !Number.isNaN(parseInt(e[0])))
  .map((e) => ({
    index: parseInt(e[0]),
    nameParts: e.slice(1),
    fileName: e.join('-'),
  }))

if (cmd === 'add') {
  makeRoom()
  add()
} else if (cmd === 'remove') {
  remove()
  fixupIndices()
}

function add() {
  const exampleCodeImport = `example${_.upperFirst(_.camelCase(name))}`

  const code = trimLines(`
    ---
    title: '${name}'
    ---
    
    # ${name}
    
    TODO: Description
    
    import {
      Playground,
      exampleSetup,
      ${exampleCodeImport}
    } from '../../../src/components/Playground'
    
    <Playground code={${exampleCodeImport}} setupCode={exampleSetup} />
  `)

  fs.writeFileSync(
    path.join(examplesDir, `${zeroPad(index)}-${_.kebabCase(name)}.mdx`),
    code
  )
}

function remove() {
  const ei = examples.findIndex((e) => e.index === index)

  if (ei !== -1) {
    fs.unlinkSync(path.join(examplesDir, examples[ei].fileName))
    examples.splice(ei, 1)
  }
}

function makeRoom() {
  if (examples.every((e) => e.index !== index)) {
    // No need to make room.
    return
  }

  for (const e of examples) {
    if (e.index >= index) {
      fs.renameSync(
        path.join(examplesDir, e.fileName),
        path.join(
          examplesDir,
          `${zeroPad(e.index + 1)}-${e.nameParts.join('-')}`
        )
      )
    }
  }
}

function fixupIndices() {
  const fixedExamples = examples.map((e, i) => ({
    ...e,
    newIndex: i + 1,
  }))

  for (const e of fixedExamples) {
    fs.renameSync(
      path.join(examplesDir, e.fileName),
      path.join(examplesDir, `${zeroPad(e.newIndex)}-${e.nameParts.join('-')}`)
    )
  }
}

function zeroPad(i) {
  return i.toString().padStart(4, '0')
}

function trimLines(str) {
  const lines = str.split('\n')

  while (lines[0].trim().length === 0) {
    lines.splice(0, 1)
  }

  const indent = lines[0].length - lines[0].trimStart().length
  return lines.map((l) => l.substr(indent)).join('\n')
}

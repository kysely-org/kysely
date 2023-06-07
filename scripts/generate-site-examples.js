/**
 * This script goes through all generated type definitions and creates
 * playground examples in the site for all code examples that are
 * annotated using the `<!-- siteExample(category: string, name: string, prority: int) -->
 * comment.
 */

const fs = require('fs')
const path = require('path')
const forEachFile = require('./util/for-each-file')
const _ = require('lodash')

const ESM_PATH = path.join(__dirname, '..', 'dist', 'esm')
const SITE_EXAMPLE_PATH = path.join(__dirname, '..', 'site', 'docs', 'examples')
const SITE_EXAMPLE_START_REGEX = /<!--\s*siteExample\(/
const SITE_EXAMPLE_ANNOTATION_REGEX =
  /<!--\s*siteExample\("([^"]+)",\s*"([^"]+)",\s*(\d+)\s*\)\s*-->/

const CODE_BLOCK_START_OR_END = /\*\s*```/
const COMMENT_LINE_REGEX = /\*\s*(.*)/
const CODE_LINE_REGEX = /\*(.*)/

function main() {
  deleteAllExamples()

  forEachFile(ESM_PATH, (filePath) => {
    if (!filePath.endsWith('.d.ts')) {
      return
    }

    const lines = readLines(filePath)
    let annotation = null
    let inExample = false
    let inCodeBlock = false
    let commentLines = []
    let codeLines = []

    for (let l = 0; l < lines.length; ++l) {
      const line = lines[l]
      const fileLine = l + 1

      if (inExample) {
        if (inCodeBlock) {
          if (CODE_BLOCK_START_OR_END.test(line)) {
            writeSiteExample({
              category: annotation[1],
              name: annotation[2],
              priority: annotation[3],
              code: trimEmptyLines(codeLines).join('\n'),
              comment: trimEmptyLines(commentLines).join('\n'),
            })

            annotation = null
            inExample = false
            inCodeBlock = false
            commentLines = []
            codeLines = []
          } else {
            const code = CODE_LINE_REGEX.exec(line)

            if (!code) {
              console.error(
                `found invalid code block in a site example in ${filePath}:${fileLine}`
              )
              process.exit(1)
            }

            codeLines.push(code[1])
          }
        } else if (CODE_BLOCK_START_OR_END.test(line)) {
          inCodeBlock = true
        } else {
          const comment = COMMENT_LINE_REGEX.exec(line)

          if (!comment) {
            console.error(
              `found invalid comment in a site example in ${filePath}:${fileLine}`
            )
            process.exit(1)
          }

          commentLines.push(comment[1])
        }
      }

      if (!SITE_EXAMPLE_START_REGEX.test(line)) {
        continue
      }

      annotation = SITE_EXAMPLE_ANNOTATION_REGEX.exec(line)

      if (!annotation) {
        console.error(
          `found invalid site example annotation in ${filePath}:${fileLine}`
        )
        process.exit(1)
      }

      inExample = true
    }
  })
}

function deleteAllExamples() {
  for (const category of fs.readdirSync(SITE_EXAMPLE_PATH)) {
    const folderPath = path.join(SITE_EXAMPLE_PATH, category)

    if (!fs.statSync(folderPath).isFile()) {
      for (const file of fs.readdirSync(folderPath)) {
        const filePath = path.join(folderPath, file)

        if (file.endsWith('.js') || file.endsWith('.mdx')) {
          fs.unlinkSync(filePath)
        }
      }
    }
  }
}

function readLines(filePath) {
  const data = fs.readFileSync(filePath).toString('utf-8')
  return data.split('\n')
}

function writeSiteExample({ name, category, priority, comment, code }) {
  const fileName = `${priority.padStart(4, '0')}-${_.kebabCase(name)}`
  const filePath = path.join(
    SITE_EXAMPLE_PATH,
    category.toUpperCase(),
    fileName
  )

  const codeFile = `export const ${_.camelCase(name)} = \`${deindent(
    code
  ).replaceAll('`', '\\`')}\``

  const exampleFileBegin = deindent(`
    ---
    title: '${name}'
    ---

    # ${name}
  `)

  const exampleFileEnd = deindent(`
    import {
      Playground,
      exampleSetup,
    } from '../../../src/components/Playground'

    import {
      ${_.camelCase(name)}
    } from './${fileName}'

    <Playground code={${_.camelCase(name)}} setupCode={exampleSetup} />
  `)

  const exampleFile = [exampleFileBegin, comment, '', exampleFileEnd].join(
    '\n'
  )

  fs.writeFileSync(filePath + '.js', codeFile)
  fs.writeFileSync(filePath + '.mdx', exampleFile)
}

function deindent(str) {
  let lines = str.split('\n')

  // Remove empty lines from the beginning.
  while (lines[0].trim().length === 0) {
    lines = lines.slice(1)
  }

  let ws = Number.MAX_SAFE_INTEGER
  for (const line of lines) {
    if (line.trim().length > 0) {
      const wsExec = /^(\s*)/.exec(line)

      if (wsExec[1].length < ws) {
        ws = wsExec[1].length
      }
    }
  }

  return lines.map((line) => line.substring(ws)).join('\n')
}

function trimEmptyLines(lines) {
  while (lines[0].trim().length === 0) {
    lines = lines.slice(1)
  }

  while (lines[lines.length - 1].trim().length === 0) {
    lines = lines.slice(0, lines.length - 1)
  }

  return lines
}

main()

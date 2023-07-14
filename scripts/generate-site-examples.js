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

const CODE_BLOCK_START_REGEX = /\*\s*```/
const CODE_BLOCK_END_REGEX = /\*\s*```/
const COMMENT_LINE_REGEX = /\*\s*(.*)/
const CODE_LINE_REGEX = /\*(.*)/

const moreExamplesByCategory = {
  select: {
    'select method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#select',
    'selectAll method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#selectAll',
    'selectFrom method':
      'https://kysely-org.github.io/kysely/classes/Kysely.html#selectFrom',
  },
  where: {
    'where method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#where',
    'whereRef method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#whereRef',
  },
  join: {
    'innerJoin method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#innerJoin',
    'leftJoin method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#leftJoin',
    'rightJoin method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#rightJoin',
    'fullJoin method':
      'https://kysely-org.github.io/kysely/interfaces/SelectQueryBuilder.html#fullJoin',
  },
  insert: {
    'values method':
      'https://kysely-org.github.io/kysely/classes/InsertQueryBuilder.html#values',
    'onConflict method':
      'https://kysely-org.github.io/kysely/classes/InsertQueryBuilder.html#onConflict',
    'returning method':
      'https://kysely-org.github.io/kysely/classes/InsertQueryBuilder.html#returning',
    'insertInto method':
      'https://kysely-org.github.io/kysely/classes/Kysely.html#insertInto',
  },
  update: {
    'set method':
      'https://kysely-org.github.io/kysely/classes/UpdateQueryBuilder.html#set',
    'returning method':
      'https://kysely-org.github.io/kysely/classes/UpdateQueryBuilder.html#returning',
    'updateTable method':
      'https://kysely-org.github.io/kysely/classes/Kysely.html#updateTable',
  },
  delete: {
    'deleteFrom method':
      'https://kysely-org.github.io/kysely/classes/Kysely.html#deleteFrom',
    'returning method':
      'https://kysely-org.github.io/kysely/classes/DeleteQueryBuilder.html#returning',
  },
  transactions: {
    'transaction method':
      'https://kysely-org.github.io/kysely/classes/Kysely.html#transaction',
  },
}

function main() {
  deleteAllExamples()

  forEachFile(ESM_PATH, (filePath) => {
    if (!filePath.endsWith('.d.ts')) {
      return
    }

    const lines = readLines(filePath)
    const state = {
      filePath,
      line: null,
      lineIndex: 0,
      annotation: null,
      inExample: false,
      inCodeBlock: false,
      commentLines: [],
      codeLines: [],
    }

    for (let l = 0; l < lines.length; ++l) {
      state.line = lines[l]
      state.lineIndex = l + 1

      if (state.inExample) {
        if (state.inCodeBlock) {
          if (isCodeBlockEnd(state)) {
            writeSiteExample(state)
            exitExample(state)
          } else {
            addCodeLine(state)
          }
        } else if (isCodeBlockStart(state)) {
          enterCodeBlock(state)
        } else {
          addCommentLine(state)
        }
      } else if (isExampleStart(state)) {
        enterExample(state)
      }
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

function isCodeBlockEnd(state) {
  return CODE_BLOCK_END_REGEX.test(state.line)
}

function writeSiteExample(state) {
  const [, category, name, priority] = state.annotation
  const code = trimEmptyLines(state.codeLines).join('\n')
  const comment = trimEmptyLines(state.commentLines).join('\n')
  const codeVariable = _.camelCase(name)

  const fileName = `${priority.padStart(4, '0')}-${_.kebabCase(name)}`
  const filePath = path.join(SITE_EXAMPLE_PATH, category, fileName)

  const codeFile = `export const ${codeVariable} = \`${deindent(code)
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')}\``

  const parts = [
    deindent(`
      ---
      title: '${name}'
      ---

      # ${name}
    `),
  ]

  if (comment?.trim()) {
    parts.push(comment, '')
  }

  parts.push(
    deindent(`
      import {
        Playground,
        exampleSetup,
      } from '../../../src/components/Playground'

      import {
        ${codeVariable}
      } from './${fileName}'

      <div style={{ marginBottom: '1em' }}>
        <Playground code={${codeVariable}} setupCode={exampleSetup} />
      </div>
    `)
  )

  const moreExamples = buildMoreExamplesMarkdown(category)
  if (moreExamples?.trim()) {
    parts.push(moreExamples)
  }

  const exampleFile = parts.join('\n')

  fs.writeFileSync(filePath + '.js', codeFile)
  fs.writeFileSync(filePath + '.mdx', exampleFile)
}

function buildMoreExamplesMarkdown(category) {
  const links = moreExamplesByCategory[category]
  if (!links) {
    return undefined
  }

  const lines = [
    ':::info More examples',
    'The API documentation is packed with examples. The API docs are hosted [here](https://kysely-org.github.io/kysely/)',
    'but you can access the same documentation by hovering over functions/methods/classes in your IDE. The examples are always',
    'just one hover away!',
    '',
    'For example, check out these sections:',
  ]

  for (const linkName of Object.keys(links)) {
    lines.push(` - [${linkName}](${links[linkName]})`)
  }

  lines.push(':::')

  return lines.join('\n')
}

function exitExample(state) {
  state.annotation = null
  state.inExample = false
  state.inCodeBlock = false
  state.commentLines = []
  state.codeLines = []
}

function addCodeLine(state) {
  const code = CODE_LINE_REGEX.exec(state.line)

  if (!code) {
    console.error(
      `found invalid code block in a site example in ${state.filePath}:${state.lineIndex}`
    )

    process.exit(1)
  }

  state.codeLines.push(code[1])
}

function isCodeBlockStart(state) {
  return CODE_BLOCK_START_REGEX.test(state.line)
}

function enterCodeBlock(state) {
  state.inCodeBlock = true
}

function addCommentLine(state) {
  const comment = COMMENT_LINE_REGEX.exec(state.line)

  if (!comment) {
    console.error(
      `found invalid comment in a site example in ${state.filePath}:${state.lineIndex}`
    )

    process.exit(1)
  }

  state.commentLines.push(comment[1])
}

function isExampleStart(state) {
  return SITE_EXAMPLE_START_REGEX.test(state.line)
}

function enterExample(state) {
  state.annotation = SITE_EXAMPLE_ANNOTATION_REGEX.exec(state.line)

  if (!state.annotation) {
    console.error(
      `found invalid site example annotation in ${state.filePath}:${state.lineIndex}`
    )

    process.exit(1)
  }

  state.inExample = true
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
  while (lines.length && lines[0].trim().length === 0) {
    lines = lines.slice(1)
  }

  while (lines.length && lines[lines.length - 1].trim().length === 0) {
    lines = lines.slice(0, lines.length - 1)
  }

  return lines
}

main()

/**
 * This script goes through all generated type definitions and creates
 * playground examples in the site for all code examples that are
 * annotated using the `<!-- siteExample(category: string, name: string, prority: int) -->
 * comment.
 */

import { createReadStream } from 'node:fs'
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'pathe'
import { toCamelCase, toKebabCase, toTitleCase } from 'remeda'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DIST_PATH = join(__dirname, '..', 'dist')
const SITE_EXAMPLE_PATH = join(__dirname, '..', 'site', 'docs', 'examples')

const SITE_EXAMPLE_START_REGEX = /<!--\s*siteExample\(/
const SITE_EXAMPLE_ANNOTATION_REGEX =
  /<!--\s*siteExample\("([^"]+)",\s*"([^"]+)",\s*(\d+)\s*\)\s*-->/

const CODE_BLOCK_START_REGEX = /\*\s*```/
const CODE_BLOCK_END_REGEX = /\*\s*```/
const COMMENT_LINE_REGEX = /\*\s*(.*)/
const CODE_LINE_REGEX = /\*(.*)/

const CAPTURE_INDENTATION_REGEX = /^(\s*)/

const DIST_IMPORT_PATH_REGEX = /['"`].*dist(\/.*)?['"`]/g

const moreExamplesByCategory = {
  select: {
    'select method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#select',
    'selectAll method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#selectAll',
    'selectFrom method':
      'https://kysely-org.github.io/kysely-apidoc/classes/Kysely.html#selectFrom',
  },
  where: {
    'where method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#where',
    'whereRef method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#whereRef',
  },
  join: {
    'innerJoin method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#innerJoin',
    'leftJoin method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#leftJoin',
    'rightJoin method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#rightJoin',
    'fullJoin method':
      'https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html#fullJoin',
  },
  insert: {
    'values method':
      'https://kysely-org.github.io/kysely-apidoc/classes/InsertQueryBuilder.html#values',
    'onConflict method':
      'https://kysely-org.github.io/kysely-apidoc/classes/InsertQueryBuilder.html#onConflict',
    'returning method':
      'https://kysely-org.github.io/kysely-apidoc/classes/InsertQueryBuilder.html#returning',
    'insertInto method':
      'https://kysely-org.github.io/kysely-apidoc/classes/Kysely.html#insertInto',
  },
  update: {
    'set method':
      'https://kysely-org.github.io/kysely-apidoc/classes/UpdateQueryBuilder.html#set',
    'returning method':
      'https://kysely-org.github.io/kysely-apidoc/classes/UpdateQueryBuilder.html#returning',
    'updateTable method':
      'https://kysely-org.github.io/kysely-apidoc/classes/Kysely.html#updateTable',
  },
  delete: {
    'deleteFrom method':
      'https://kysely-org.github.io/kysely-apidoc/classes/Kysely.html#deleteFrom',
    'returning method':
      'https://kysely-org.github.io/kysely-apidoc/classes/DeleteQueryBuilder.html#returning',
  },
  merge: {
    'mergeInto method':
      'https://kysely-org.github.io/kysely-apidoc/classes/Kysely.html#mergeInto',
    'using method':
      'https://kysely-org.github.io/kysely-apidoc/classes/MergeQueryBuilder.html#using',
    'whenMatched method':
      'https://kysely-org.github.io/kysely-apidoc/classes/WheneableMergeQueryBuilder.html#whenMatched',
    'thenUpdateSet method':
      'https://kysely-org.github.io/kysely-apidoc/classes/MatchedThenableMergeQueryBuilder.html#thenUpdateSet',
    'thenDelete method':
      'https://kysely-org.github.io/kysely-apidoc/classes/MatchedThenableMergeQueryBuilder.html#thenDelete',
    'thenDoNothing method':
      'https://kysely-org.github.io/kysely-apidoc/classes/MatchedThenableMergeQueryBuilder.html#thenDoNothing',
    'whenNotMatched method':
      'https://kysely-org.github.io/kysely-apidoc/classes/WheneableMergeQueryBuilder.html#whenNotMatched',
    'thenInsertValues method':
      'https://kysely-org.github.io/kysely-apidoc/classes/NotMatchedThenableMergeQueryBuilder.html#thenInsertValues',
  },
  transactions: {
    'transaction method':
      'https://kysely-org.github.io/kysely-apidoc/classes/Kysely.html#transaction',
  },
} as const

interface State {
  annotation:
    | [string, category: string, name: string, priority: `${number}`]
    | null
  codeLines: string[]
  commentLines: string[]
  filePath: string
  inCodeBlock: boolean
  inExample: boolean
  line: string
  lineIndex: number
}

async function main(): Promise<void> {
  await deleteAllExamples()

  const dirents = await readdir(DIST_PATH, {
    recursive: true,
    withFileTypes: true,
  })

  await Promise.all([
    ...dirents.map(async (dirent) => {
      const { name, parentPath } = dirent

      if (!name.endsWith('.d.ts')) {
        return
      }

      const filePath = join(parentPath, name)

      const readStream = createReadStream(filePath)
      const rl = createInterface({
        crlfDelay: Infinity, // Recognize all instances of CR LF as a single line break
        input: readStream,
      })

      const state: State = {
        annotation: null,
        codeLines: [],
        commentLines: [],
        filePath,
        inCodeBlock: false,
        inExample: false,
        line: '',
        lineIndex: 0,
      }

      try {
        for await (const line of rl) {
          state.line = line
          state.lineIndex++

          if (state.inExample) {
            if (state.inCodeBlock) {
              if (CODE_BLOCK_END_REGEX.test(line)) {
                await writeSiteExample(state)

                state.annotation = null
                state.codeLines = []
                state.commentLines = []
                state.inCodeBlock = false
                state.inExample = false
              } else {
                addCodeLine(state)
              }
            } else if (CODE_BLOCK_START_REGEX.test(line)) {
              state.inCodeBlock = true
            } else {
              addCommentLine(state)
            }
          } else if (SITE_EXAMPLE_START_REGEX.test(line)) {
            enterExample(state)
          }
        }
      } catch (error: unknown) {
        console.error(`Error reading file: ${error}`)
      } finally {
        rl.close()
        readStream.close()
      }
    }),
    overwritePlaygroundTypes(),
  ])
}

async function deleteAllExamples(): Promise<void> {
  const dirents = await readdir(SITE_EXAMPLE_PATH, {
    recursive: true,
    withFileTypes: true,
  })

  await Promise.all(
    dirents.map(async (dirent) => {
      const { name, parentPath } = dirent

      if (name.endsWith('.js') || name.endsWith('.mdx')) {
        await unlink(join(parentPath, name))
      }
    }),
  )
}

const FILENAME_SANITIZER_REGEX = /['\u2019\u0300-\u036f,/]/g

async function writeSiteExample(state: State): Promise<void> {
  const { annotation, codeLines, commentLines } = state

  if (!annotation) {
    throw new Error('site examples require an annotation!')
  }

  const [, category, name, priority] = annotation
  const code = trimEmptyLines(codeLines).join('\n')
  const comment = trimEmptyLines(commentLines).join('\n')

  const sanitizedName = name
    .normalize('NFD')
    .replace(FILENAME_SANITIZER_REGEX, '')

  const codeVariable = toCamelCase(sanitizedName, {
    preserveConsecutiveUppercase: false,
  })
  const fileName = `${priority.padStart(4, '0')}-${toKebabCase(sanitizedName)}`
  const folderPath = join(SITE_EXAMPLE_PATH, category)
  const filePath = join(folderPath, fileName)

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
      import { Playground } from '../../../src/components/Playground'

      import {
        ${codeVariable}
      } from './${fileName}'

      <div style={{ marginBottom: '1em' }}>
        <Playground code={${codeVariable}} />
      </div>
    `),
  )

  const moreExamples = buildMoreExamplesMarkdown(category)

  if (moreExamples?.trim()) {
    parts.push(moreExamples)
  }

  const exampleFile = parts.join('\n')

  const hasCreated = await mkdir(folderPath, { recursive: true })

  await Promise.all([
    hasCreated != null &&
      writeFile(
        join(folderPath, '_category_.json'),
        `{
  "label": "${toTitleCase(category)}",
  "position": 0, // TODO: set the position of the category.
  "link": {
    "type": "generated-index",
    "description": "Short and simple examples of using the ${category} functionality." // TODO: review this.
  }
}`,
      ),
    writeFile(filePath + '.js', codeFile),
    writeFile(filePath + '.mdx', exampleFile),
  ])
}

function buildMoreExamplesMarkdown(category: string): string | null {
  const links = moreExamplesByCategory[category as never]

  if (!links) {
    return null
  }

  const lines = [
    ':::info[More examples]',
    'The API documentation is packed with examples. The API docs are hosted [here](https://kysely-org.github.io/kysely-apidoc/),',
    'but you can access the same documentation by hovering over functions/methods/classes in your IDE. The examples are always',
    'just one hover away!',
    '',
    'For example, check out these sections:',
  ]

  for (const linkName of Object.keys(links)) {
    lines.push(` - [${linkName}](${links[linkName]})`)
  }

  lines.push(':::\n')

  return lines.join('\n')
}

function addCodeLine(state: State): void {
  const { codeLines, filePath, line, lineIndex } = state

  const [, code] = CODE_LINE_REGEX.exec(line) || []

  if (code == null) {
    console.error(
      `found invalid code block in a site example in ${filePath}:${lineIndex}`,
    )

    process.exit(1)
  }

  codeLines.push(code)
}

function addCommentLine(state: State): void {
  const { commentLines, filePath, line, lineIndex } = state

  const [, comment] = COMMENT_LINE_REGEX.exec(line) || []

  if (comment == null) {
    console.error(
      `found invalid comment in a site example in ${filePath}:${lineIndex}`,
    )

    process.exit(1)
  }

  commentLines.push(comment)
}

function enterExample(state: State): void {
  const { filePath, line, lineIndex } = state

  state.annotation = SITE_EXAMPLE_ANNOTATION_REGEX.exec(
    line,
  ) as typeof state.annotation

  if (!state.annotation) {
    console.error(
      `found invalid site example annotation in ${filePath}:${lineIndex}`,
    )

    process.exit(1)
  }

  state.inExample = true
}

function deindent(str: string): string {
  let lines = str.split('\n')

  // Remove empty lines from the beginning.
  while (lines[0].trim().length === 0) {
    lines = lines.slice(1)
  }

  let minIndentationLength = Number.MAX_SAFE_INTEGER

  for (const line of lines) {
    if (line.trim().length > 0) {
      const [, indentation] = CAPTURE_INDENTATION_REGEX.exec(line) || []

      if (indentation != null && indentation.length < minIndentationLength) {
        minIndentationLength = indentation.length
      }
    }
  }

  return lines.map((line) => line.substring(minIndentationLength)).join('\n')
}

function trimEmptyLines(lines: string[]): string[] {
  while (lines.length && lines[0].trim().length === 0) {
    lines = lines.slice(1)
  }

  while (lines.length && lines[lines.length - 1].trim().length === 0) {
    lines = lines.slice(0, lines.length - 1)
  }

  return lines
}

async function overwritePlaygroundTypes(): Promise<void> {
  const jsdocsTestTypes = await readFile(
    join(__dirname, '../deno.check.d.ts'),
    { encoding: 'utf-8' },
  )

  const playgroundTypes = `// THIS FILE IS GENERATED BY \`${relative('.', __filename)}\`
// DO NOT EDIT THIS FILE DIRECTLY
export const GENERATED_PLAYGROUND_EXAMPLE_TYPES = \`${jsdocsTestTypes
    .replace(DIST_IMPORT_PATH_REGEX, "'kysely'")
    .replaceAll('`', '\\`')}\`;`

  await writeFile(
    join(__dirname, '../site/src/components/playground-example-types.ts'),
    playgroundTypes,
    { encoding: 'utf-8' },
  )
}

main()

import {
  mkdir,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import type { LoadContext, Plugin } from '@docusaurus/types'
import { join } from 'pathe'
import { createReadStream } from 'node:fs'

interface FileScanState {
  annotation: RegExpExecArray | null
  codeLines: string[]
  commentLines: string[]
}

const EXAMPLES_FOLDER_PATH = join(__dirname, '../../docs/examples')
const SOURCE_CODE_FOLDER_PATH = join(__dirname, '../../../src')
const DOCUSAURUS_CACHE_FOLDER_PATH = join(__dirname, '../../.docusaurus')
const GLOBAL_DATA_JSON_PATH = join(
  DOCUSAURUS_CACHE_FOLDER_PATH,
  'globalData.json',
)

const CHOSEN_EXAMPLE_BLOCK_START_REGEX = /<!--\s*siteExample\(/
const CHOSEN_EXAMPLE_ANNOTATION_REGEX =
  /<!--\s*siteExample\("([^"]+)",\s*"([^"]+)",\s*(\d+)\s*\)\s*-->/
const CODE_BLOCK_FENCE_REGEX = /\*\s*```/
const CODE_LINE_REGEX = /\*(.*)/
const COMMENT_LINE_REGEX = /\*\s*(.*)/

export default (_context: LoadContext): Plugin => ({
  name: 'generate-examples-plugin',
  getPathsToWatch() {
    return [SOURCE_CODE_FOLDER_PATH]
  },

  async loadContent() {
    console.time('generate-examples-plugin:loadContent')

    try {
      await clearPreviouslyGeneratedExamples()

      const dirents = await readdir(SOURCE_CODE_FOLDER_PATH, {
        recursive: true,
        withFileTypes: true,
      })

      // consider PromisePool if this consumes too much memory.
      await Promise.all(
        dirents.map(async (dirent) => {
          if (!dirent.isFile() || !dirent.name.endsWith('.ts')) {
            return
          }

          const filePath = join(dirent.parentPath, dirent.name)

          const readStream = createReadStream(filePath, { encoding: 'utf8' })

          const lineIterator = createInterface({
            crlfDelay: Infinity, // To handle all line-ending types
            input: readStream,
          })

          const state: FileScanState = {
            annotation: null,
            commentLines: [],
            codeLines: [],
          }

          let inChosenExample = false
          let inCodeBlock = false
          let lineNumber = 0
          let recreateExamplesFolderPromise = null

          for await (const line of lineIterator) {
            lineNumber++

            if (
              !inChosenExample &&
              CHOSEN_EXAMPLE_BLOCK_START_REGEX.test(line)
            ) {
              const annotation = execStrict(
                CHOSEN_EXAMPLE_ANNOTATION_REGEX,
                line,
                { filePath, lineNumber, subject: 'annotation' },
              )

              state.annotation = annotation
              inChosenExample = true
              continue
            }

            if (!inChosenExample) {
              continue
            }

            if (!inCodeBlock && CODE_BLOCK_FENCE_REGEX.test(line)) {
              inCodeBlock = true
              continue
            }

            if (!inCodeBlock) {
              const [, commentLine] = execStrict(COMMENT_LINE_REGEX, line, {
                filePath,
                lineNumber,
                subject: 'comment',
              })

              state.commentLines.push(commentLine)
              continue
            }

            if (!CODE_BLOCK_FENCE_REGEX.test(line)) {
              const [, codeLine] = execStrict(CODE_LINE_REGEX, line, {
                filePath,
                lineNumber,
                subject: 'line of code',
              })

              state.codeLines.push(codeLine)
              continue
            }

            await (recreateExamplesFolderPromise ||= mkdir(
              EXAMPLES_FOLDER_PATH,
              {
                recursive: true,
              },
            ))

            // TODO: await writeSiteExample(state)
            // Temporarily disabled to prevent dev server issues
            // await writeFile(
            //   join(EXAMPLES_FOLDER_PATH, `moshe-${Date.now()}.md`),
            //   'SAMPLE TEXT',
            //   {},
            // )

            state.annotation = null
            state.codeLines = []
            state.commentLines = []
            inCodeBlock = inChosenExample = false
          }
        }),
      )

      // TODO: await overwritePlaygroundTypes()
    } catch (error) {
      console.error('Error in generate-examples-plugin:', error)
      // Continue execution even if plugin fails
    }

    console.timeEnd('generate-examples-plugin:loadContent')
  },
})

async function clearPreviouslyGeneratedExamples(): Promise<void> {
  await Promise.all([
    rm(EXAMPLES_FOLDER_PATH, { force: true, recursive: true }),
    clearExampleFileMetadata(),
    clearGlobalData(),
  ])
}

async function clearExampleFileMetadata(): Promise<void> {
  const dirents = await readdir(
    join(DOCUSAURUS_CACHE_FOLDER_PATH, 'docusaurus-plugin-content-docs'),
    { recursive: true, withFileTypes: true },
  )

  await Promise.all(
    dirents.map(async (dirent) => {
      if (!dirent.isFile() || !dirent.name.startsWith('site-docs-examples-')) {
        return
      }

      await unlink(join(dirent.parentPath, dirent.name))
    }),
  )
}

async function clearGlobalData(): Promise<void> {
  const globalData = JSON.parse(
    await readFile(GLOBAL_DATA_JSON_PATH, { encoding: 'utf8' }).catch(
      () => '{}',
    ),
  ) as {
    'docusaurus-plugin-content-docs'?: {
      default?: {
        versions?: { docs?: { id?: string; path?: string }[] }[]
      }
    }
  }

  for (const version of globalData?.['docusaurus-plugin-content-docs']?.default
    ?.versions || []) {
    version.docs = version.docs?.filter(
      (doc) => !doc.id?.startsWith('examples/'),
    )
  }

  await writeFile(GLOBAL_DATA_JSON_PATH, JSON.stringify(globalData, null, 2))
}

function execStrict(
  regex: RegExp,
  line: string,
  meta: {
    filePath: string
    lineNumber: number
    subject: 'annotation' | 'line of code' | 'comment'
  },
): RegExpExecArray {
  const subject = regex.exec(line)

  if (!subject) {
    throw new Error(
      `found invalid ${meta.subject} in a site example in ${meta.filePath}:${meta.lineNumber}`,
    )
  }

  return subject
}

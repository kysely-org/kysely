/**
 * Generates syntax-highlighted HTML for the landing page code figures using
 * shiki, so no highlighting JavaScript ships to the client.
 *
 * The snippets below are the source of truth. After editing them, run
 * `pnpm snippets` (also runs automatically as part of `pnpm build`) to
 * regenerate `src/components/snippets.generated.ts`.
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { codeToHtml } from 'shiki'

// Dual themes: Dark+ matches the hero demo video; Light+ is its light-mode
// sibling. Emitted as CSS variables and switched by [data-theme] in CSS.
const THEMES = { dark: 'dark-plus', light: 'light-plus' }

const compilerSnippet = `const rows = await db
  .selectFrom('person')
  .select('first_name')
  .where('person.ag', '>', 18)
  .execute()`

const compositionSnippet = `function withPets(eb: ExpressionBuilder<DB, 'person'>) {
  return jsonArrayFrom(
    eb.selectFrom('pet')
      .select(['pet.name', 'pet.species'])
      .whereRef('pet.owner_id', '=', 'person.id')
  ).as('pets')
}

const person = await db
  .selectFrom('person')
  .select((eb) => ['person.id', 'person.first_name', withPets(eb)])
  .executeTakeFirstOrThrow()`

function highlight(code, decorations = []) {
  return codeToHtml(code, {
    lang: 'ts',
    themes: THEMES,
    defaultColor: false,
    decorations,
  })
}

const squiggleTarget = "'person.ag'"
const squiggleStart = compilerSnippet.indexOf(squiggleTarget)

const [compilerHtml, compositionHtml] = await Promise.all([
  highlight(compilerSnippet, [
    {
      start: squiggleStart,
      end: squiggleStart + squiggleTarget.length,
      properties: { class: 'kl-squiggle' },
    },
  ]),
  highlight(compositionSnippet),
])

const output = `// AUTO-GENERATED FILE — DO NOT EDIT.
// Source of truth: scripts/highlight-snippets.mjs. Regenerate with \`pnpm snippets\`.

export const compilerSnippetHtml = ${JSON.stringify(compilerHtml)}

export const compositionSnippetHtml = ${JSON.stringify(compositionHtml)}
`

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const targetPath = join(siteRoot, 'src', 'components', 'snippets.generated.ts')

await writeFile(targetPath, output)
console.log(`wrote ${targetPath}`)

/**
 * This script removes global augmentations so we could publish to JSR.
 * https://github.com/denoland/deno/issues/23427
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import ts from 'typescript'

const __dirname = dirname(fileURLToPath(import.meta.url))

const kyselyTSPath = join(__dirname, '../src/kysely.ts')

const sourceCode = readFileSync(kyselyTSPath, 'utf8')

const sourceFile = ts.createSourceFile(
  kyselyTSPath,
  sourceCode,
  ts.ScriptTarget.Latest,
  true,
)

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

const nodesToRemove = new Set<ts.Node>()

function visit(node: ts.Node) {
  if (ts.isModuleDeclaration(node) && node.name.text === 'global') {
    return nodesToRemove.add(node)
  }

  ts.forEachChild(node, visit)
}

visit(sourceFile)

const newStatements = sourceFile.statements.filter(
  (stmt) => !nodesToRemove.has(stmt),
)

const newSourceFile = ts.factory.updateSourceFile(sourceFile, newStatements)

const result = printer.printFile(newSourceFile)

writeFileSync(kyselyTSPath, result, 'utf8')

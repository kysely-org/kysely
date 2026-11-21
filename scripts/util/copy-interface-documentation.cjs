const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript-6')
const forEachFile = require('./for-each-file.cjs')

/**
 * Copies inherited documentation to undocumented members. Comments containing
 * only @remarks extend the inherited description. A local Examples section
 * replaces inherited examples. Comments with their own summary are preserved.
 *
 * Works on both source and declaration files. Only comments are changed.
 */
function copyInterfaceDocumentation(directory) {
  const files = new Map()
  const objects = new Map()
  const lineMappings = {}

  forEachFile(directory, (filePath) => {
    if (!filePath.endsWith('.ts')) return

    const text = fs.readFileSync(filePath, 'utf8')
    const source = ts.createSourceFile(
      filePath,
      text,
      ts.ScriptTarget.Latest,
      true,
    )
    const file = {
      path: filePath,
      text,
      source,
      objects: new Map(),
      imports: new Map(),
      edits: [],
    }
    files.set(path.resolve(filePath), file)

    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement) && statement.importClause) {
        const bindings = statement.importClause.namedBindings
        if (bindings && ts.isNamedImports(bindings)) {
          for (const binding of bindings.elements) {
            file.imports.set(binding.name.text, {
              name: binding.propertyName?.text ?? binding.name.text,
              module: statement.moduleSpecifier.text,
            })
          }
        }
      }

      if (
        !(
          ts.isClassDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement)
        ) ||
        !statement.name
      )
        continue

      const object = {
        name: statement.name.text,
        file,
        parents: [],
        members: new Map(),
      }
      file.objects.set(object.name, object)
      if (!objects.has(object.name)) objects.set(object.name, [])
      objects.get(object.name).push(object)

      for (const clause of statement.heritageClauses ?? []) {
        for (const type of clause.types)
          object.parents.push(type.expression.getText(source))
      }

      for (const node of statement.members) {
        if (!node.name || ts.isPrivateIdentifier(node.name)) continue
        const name = node.name.getText(source)
        const isStatic = node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
        )
        const key = `${isStatic ? 'static:' : ''}${name}`
        const comment = node.jsDoc?.at(-1)
        const member = {
          node,
          object,
          comment,
          doc: comment && readComment(comment, source),
        }
        if (!object.members.has(key)) object.members.set(key, [])
        object.members.get(key).push(member)
      }
    }
  })

  function findParent(object, name) {
    const local = object.file.objects.get(name)
    if (local) return local

    const imported = object.file.imports.get(name)
    if (imported?.module.startsWith('.')) {
      const base = path.resolve(path.dirname(object.file.path), imported.module)
      for (const candidate of [
        base,
        base.replace(/\.js$/, '.ts'),
        base.replace(/\.js$/, '.d.ts'),
      ]) {
        const found = files.get(candidate)?.objects.get(imported.name)
        if (found) return found
      }
    }

    const matches = objects.get(name)
    return matches?.length === 1 ? matches[0] : undefined
  }

  function inheritedDoc(object, key, seen) {
    for (const name of object.parents) {
      const parent = findParent(object, name)
      if (!parent || seen.has(parent)) continue
      const next = new Set([...seen, parent])
      const member = parent.members.get(key)?.[0]
      const doc = member
        ? effectiveDoc(member, key, next)
        : inheritedDoc(parent, key, next)
      if (doc) return doc
    }
  }

  function effectiveDoc(member, key, seen) {
    if (member.doc && !isExtension(member.doc)) return member.doc
    const parent = inheritedDoc(member.object, key, seen)
    if (!parent) return member.doc
    return member.doc ? extendDoc(parent, member.doc) : parent
  }

  for (const file of files.values()) {
    for (const object of file.objects.values()) {
      for (const [key, members] of object.members) {
        for (const [index, member] of members.entries()) {
          // Document the first overload. On subsequent runs it has its own
          // summary, so documentation isn't copied to additional overloads.
          if (!member.doc && index !== 0) continue
          if (member.doc && !isExtension(member.doc)) continue
          const doc = effectiveDoc(member, key, new Set([object]))
          if (!doc || doc === member.doc) continue
          const start =
            member.comment?.getStart(file.source) ??
            member.node.getStart(file.source)
          const end = member.comment?.end ?? start
          const lineStart = file.text.lastIndexOf('\n', start - 1) + 1
          const indentation = file.text.slice(lineStart, start).match(/^\s*/)[0]
          const replacement =
            renderComment(doc, indentation) +
            (member.comment ? '' : `\n${indentation}`)
          file.edits.push({ start, end, replacement })
        }
      }
    }

    if (file.edits.length) {
      let offset = 0
      lineMappings[
        path.relative(directory, file.path).split(path.sep).join('/')
      ] = file.edits
        .slice()
        .sort((a, b) => a.start - b.start)
        .map((edit) => {
          offset +=
            countNewlines(edit.replacement) -
            countNewlines(file.text.slice(edit.start, edit.end))
          return [
            countNewlines(file.text.slice(0, edit.end)) + 1 + offset,
            offset,
          ]
        })
    }

    for (const edit of file.edits.sort((a, b) => b.start - a.start)) {
      file.text =
        file.text.slice(0, edit.start) +
        edit.replacement +
        file.text.slice(edit.end)
    }
    if (file.edits.length) fs.writeFileSync(file.path, file.text)
  }

  return lineMappings
}

function countNewlines(text) {
  return text.split('\n').length - 1
}

function readComment(comment, source) {
  const raw = comment.getText(source).slice(3, -2)
  const lines = trimLines(
    raw.split('\n').map((line) => line.replace(/^\s*\* ?/, '')),
  )
  if (lines.length) {
    lines[0] = lines[0].trimStart()
    lines[lines.length - 1] = lines.at(-1).trimEnd()
  }
  const doc = { summary: [], tags: [] }
  let target = doc.summary
  let fenced = false

  for (const line of lines) {
    if (/^\s*```/.test(line)) fenced = !fenced
    const tag = !fenced && /^@(\w+)\b\s*(.*)$/.exec(line)
    if (tag) {
      const block = { name: tag[1], lines: [tag[2]] }
      doc.tags.push(block)
      target = block.lines
    } else {
      target.push(line)
    }
  }

  doc.summary = trimLines(doc.summary)
  for (const tag of doc.tags) tag.lines = trimLines(tag.lines)
  return doc
}

function isExtension(doc) {
  return (
    doc.summary.length === 0 && doc.tags.some((tag) => tag.name === 'remarks')
  )
}

function extendDoc(parent, local) {
  const remarks = local.tags
    .filter((tag) => tag.name === 'remarks')
    .flatMap((tag) => tag.lines)
  const parentRemarks = parent.tags
    .filter((tag) => tag.name === 'remarks')
    .flatMap((tag) => tag.lines)
  let summary = joinLines(parent.summary, parentRemarks)
  const examples = summary.findIndex((line) => /^### Examples\s*$/.test(line))
  const hasLocalExamples = remarks.some((line) =>
    /^### Examples\s*$/.test(line),
  )

  if (examples !== -1) {
    const inheritedExamples = summary.slice(examples)
    summary = joinLines(trimLines(summary.slice(0, examples)), remarks)
    if (!hasLocalExamples) summary = joinLines(summary, inheritedExamples)
  } else {
    summary = joinLines(summary, remarks)
  }

  const localTags = local.tags.filter((tag) => tag.name !== 'remarks')
  const tags = parent.tags.filter(
    (tag) =>
      tag.name !== 'remarks' &&
      !localTags.some((local) => local.name === tag.name),
  )
  return { summary, tags: [...tags, ...localTags] }
}

function joinLines(first, second) {
  return first.length && second.length
    ? [...first, '', ...second]
    : [...first, ...second]
}

function trimLines(lines) {
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines.at(-1).trim()) lines.pop()
  return lines
}

function renderComment(doc, indentation) {
  let lines = [...doc.summary]
  for (const tag of doc.tags) {
    const [first = '', ...rest] = tag.lines
    lines = joinLines(lines, [
      `@${tag.name}${first ? ` ${first}` : ''}`,
      ...rest,
    ])
  }
  return [
    '/**',
    ...lines.map((line) => `${indentation} *${line ? ` ${line}` : ''}`),
    `${indentation} */`,
  ].join('\n')
}

module.exports = { copyInterfaceDocumentation }

const LINE_CLASSES = ['twoslash-error-line', 'twoslash-query-line']

function isMetaLine(node) {
  return (
    node.type === 'element' &&
    Array.isArray(node.properties?.className) &&
    node.properties.className.some((name) => LINE_CLASSES.includes(name))
  )
}

function textOf(node) {
  if (node.type === 'text') return node.value
  return (node.children ?? []).map(textOf).join('')
}

export default function rehypeTwoslashComments() {
  return function visit(node) {
    if (isMetaLine(node)) {
      const text = textOf(node).trim().replace(/\s+/g, ' ')
      node.children = [{ type: 'text', value: `// ${text}\n` }]
      return
    }
    node.children?.forEach(visit)
  }
}

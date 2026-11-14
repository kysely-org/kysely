function isErrorLine(node) {
  return (
    node.type === 'element' &&
    Array.isArray(node.properties?.className) &&
    node.properties.className.includes('twoslash-error-line')
  )
}

export default function rehypeTwoslashErrorComments() {
  return function visit(node) {
    if (isErrorLine(node)) {
      node.children = [
        { type: 'text', value: '// ' },
        ...node.children,
        { type: 'text', value: '\n' },
      ]
      return
    }
    node.children?.forEach(visit)
  }
}

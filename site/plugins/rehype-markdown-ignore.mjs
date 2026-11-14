function isIgnored(node) {
  return (
    node.type === 'element' &&
    node.properties?.dataMarkdownIgnore !== undefined &&
    node.properties.dataMarkdownIgnore !== false
  )
}

export default function rehypeMarkdownIgnore() {
  return function strip(node) {
    if (!node.children) return
    node.children = node.children.filter((child) => !isIgnored(child))
    node.children.forEach(strip)
  }
}

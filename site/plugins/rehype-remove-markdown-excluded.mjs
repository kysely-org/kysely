export default function rehypeRemoveMarkdownExcluded() {
  return function removeExcluded(node) {
    if (!node.children) {
      return
    }

    node.children = node.children.filter(
      (child) => child.properties?.dataMarkdownExclude !== 'true',
    )
    node.children.forEach(removeExcluded)
  }
}

export default function rehypeRemoveComments() {
  return function removeComments(node) {
    if (!node.children) {
      return
    }

    // Strip React's HTML separators before they become Markdown blocks.
    node.children = node.children.filter((child) => child.type !== 'comment')
    node.children.forEach(removeComments)
  }
}

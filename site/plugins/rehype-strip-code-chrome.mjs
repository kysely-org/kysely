const CHROME_CLASSES = [
  'shiki-toolbar',
  'shiki-copy-status',
  'twoslash-popup-container',
]

function isChrome(node) {
  if (node.type !== 'element') return false
  const { className, role } = node.properties ?? {}
  return (
    role === 'tablist' ||
    (Array.isArray(className) &&
      className.some((name) => CHROME_CLASSES.includes(name)))
  )
}

export default function rehypeStripCodeChrome() {
  return function strip(node) {
    if (!node.children) return
    node.children = node.children.filter((child) => !isChrome(child))
    node.children.forEach(strip)
  }
}

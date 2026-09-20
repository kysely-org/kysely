export default function remarkAgentDocs({ url }) {
  return (tree) => {
    // The homepage's HTML extraction already includes the shared Root hint.
    const firstNode = tree.children[0]
    if (
      firstNode?.type === 'paragraph' &&
      firstNode.children[0]?.type === 'text' &&
      firstNode.children[0].value.startsWith('AI agents: Read')
    ) {
      return
    }

    tree.children.unshift({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'AI agents: Read ' },
        {
          type: 'link',
          url: new URL('/llms.txt', url).href,
          children: [{ type: 'text', value: 'llms.txt' }],
        },
        {
          type: 'text',
          value:
            ' for the documentation index and links to Markdown (.md) versions of individual pages. Read ',
        },
        {
          type: 'link',
          url: new URL('/llms-full.txt', url).href,
          children: [{ type: 'text', value: 'llms-full.txt' }],
        },
        { type: 'text', value: ' for the full documentation in one file.' },
      ],
    })
  }
}

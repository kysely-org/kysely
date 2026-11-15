import CodeBlock from '@site/src/theme/CodeBlock'
import { HIGHLIGHTED_CODE } from './code.generated'

const loadPopups = () => import('./popups.generated').then((m) => m.POPUPS)

export function TypeScriptCode(props: { code: string; title: string }) {
  return (
    <CodeBlock
      language="ts"
      title={props.title}
      highlightedHtml={HIGHLIGHTED_CODE[props.code]}
      loadPopups={loadPopups}
    >
      {props.code}
    </CodeBlock>
  )
}

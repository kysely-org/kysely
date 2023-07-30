import * as React from 'react'
import { Playground } from './Playground'

export function CodeExample({ example }: { example: string }) {
  const lines = example.split('\n')
  const indexOfStartExample = lines.findIndex((line) =>
    TOKEN_START_EXAMPLE.test(line)
  )
  const indexOfEndExample = lines.findIndex((line) =>
    TOKEN_END_EXAMPLE.test(line)
  )
  const filteredLines = lines.filter(
    (_, index) =>
      index >= indexOfStartExample + 1 && index <= indexOfEndExample - 1
  )

  return <Playground code={filteredLines.join('\n')} />
}

const TOKEN_START_EXAMPLE = /@docs.start-example/
const TOKEN_END_EXAMPLE = /@docs.end-example/

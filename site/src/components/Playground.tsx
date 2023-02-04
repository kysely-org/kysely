import * as React from 'react'
import { gray } from '@radix-ui/colors'

export function Playground({ url }: { url: string }) {
  return (
    <iframe
      style={{
        width: '100%',
        minHeight: '400px',
        border: `1px solid ${gray.gray11}`,
        padding: 4,
        borderRadius: 8,
        background: '#1e1e1e',
      }}
      src={url}
    />
  )
}

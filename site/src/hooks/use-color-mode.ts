import {
  type ColorMode,
  useColorMode as useColorModeNative,
} from '@docusaurus/theme-common'
import { useEffect } from 'react'

export function useColorMode() {
  const { colorMode, setColorMode } = useColorModeNative()

  useEffect(() => {
    const theme = localStorage.getItem('theme')

    if (isColorMode(theme)) {
      setColorMode(theme)
    }
  }, [])

  return { colorMode }
}

function isColorMode(value: unknown): value is ColorMode {
  return ['light', 'dark'].includes(value as any)
}

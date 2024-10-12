import {
  type ColorMode,
  useColorMode as useColorModeNative,
} from '@docusaurus/theme-common'
import { useEffect } from 'react'

export function useColorMode() {
  const { colorMode, setColorMode } = useColorModeNative()

  useEffect(() => {
    const theme = localStorage.getItem('theme')

    console.log({ theme, colorMode })

    if (isColorMode(theme) && theme !== colorMode) {
      setColorMode(theme)
    }
  }, [colorMode])

  return { colorMode }
}

function isColorMode(value: unknown): value is ColorMode {
  return ['light', 'dark'].includes(value as any)
}

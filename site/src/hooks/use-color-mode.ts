import { useColorMode as useColorModeNative } from '@docusaurus/theme-common'
import useIsBrowser from '@docusaurus/useIsBrowser'

export function useColorMode() {
  const colorMode = useColorModeNative()
  const isBrowser = useIsBrowser()

  if (isBrowser) {
    const persistedTheme = localStorage.getItem('theme')

    if (persistedTheme) {
      console.log({ persistedTheme, colorMode })
    }
  }

  return colorMode
}

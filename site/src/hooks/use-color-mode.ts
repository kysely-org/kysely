import { useColorMode as useColorModeNative } from '@docusaurus/theme-common'

export function useColorMode() {
  const { colorMode } = useColorModeNative()

  return { colorMode }
}

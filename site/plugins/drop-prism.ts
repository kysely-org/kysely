import type { Plugin } from '@docusaurus/types'

export default function dropPrism(): Plugin {
  return {
    name: 'drop-prism',
    configureWebpack(_config, _isServer, { currentBundler }) {
      return {
        plugins: [
          new currentBundler.instance.NormalModuleReplacementPlugin(
            /@docusaurus[\\/]theme-classic[\\/]lib[\\/]prism-include-languages\.js$/,
            require.resolve('./prism-include-languages-stub.js'),
          ),
        ],
      }
    },
  }
}

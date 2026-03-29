import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import { dirname, extname, join, relative, resolve } from 'pathe'
import { defineConfig } from 'tsdown'
import packageJSON from './package.json' with { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const gzipAsync = promisify(gzip)

export default defineConfig({
  attw: {
    enabled: 'ci-only',
    level: 'error',
  },
  cjsDefault: true,
  clean: ['./dist', './helpers'],
  dts: {
    enabled: true,
  },
  entry: ['./src/index.ts', './src/helpers/*.ts'],
  exports: {
    customExports: function expandWithDTS(exports) {
      return Object.fromEntries(
        Object.entries(exports).map(([path, mappings]) => [
          path,
          {
            import: {
              types: mappings.import.replace('.js', '.d.ts'),
              default: mappings.import,
            },
            require: {
              types: mappings.require.replace('.cjs', '.d.cts'),
              default: mappings.require,
            },
          },
        ]),
      )
    },
    enabled: true,
    legacy: true,
    packageJson: false,
  },
  format: {
    cjs: {
      plugins: [
        {
          name: 'node10',
          writeBundle: makeNode10CJSRootRedirects,
        },
      ],
    },
    esm: {},
  },
  minify: false,
  outDir: 'dist',
  platform: 'neutral',
  publint: {
    enabled: 'ci-only',
    level: 'error',
    strict: true,
  },
  treeshake: {},
})

async function makeNode10CJSRootRedirects(): Promise<void> {
  const node10Path = join(__dirname, 'helpers')

  await mkdir(node10Path, { recursive: true })

  const descriptors = await Promise.all(
    (['mssql', 'mysql', 'postgres', 'sqlite'] as const).flatMap((dialect) => {
      const path = `helpers/${dialect}` as const

      const { default: codePath } = packageJSON.exports[`./${path}`].require

      const relativeCodePath = relative(node10Path, codePath)

      return [
        writeAsset(
          `module.exports = require('${relativeCodePath}')`,
          `${path}.js`,
        ),
        writeAsset(`export * from '${relativeCodePath}'`, `${path}.d.ts`),
      ]
    }),
  )

  printAssets(descriptors, 'CJS')
}

interface AssetDescriptor {
  displayPath: string
  gzipSize: number
  size: number
}

async function writeAsset(
  content: string,
  displayPath: string,
): Promise<AssetDescriptor> {
  const contentBuffer = Buffer.from(content)

  const [gzip] = await Promise.all([
    gzipAsync(contentBuffer),
    writeFile(join(__dirname, displayPath), contentBuffer),
  ])

  return {
    gzipSize: gzip.byteLength,
    displayPath,
    size: contentBuffer.byteLength,
  }
}

function printAssets(descriptors: AssetDescriptor[], context: string): void {
  if (!descriptors.length) {
    return
  }

  const displayContext = `\x1b[34mℹ\x1b[39m \x1b[33m[${context}]\x1b[39m`

  const totalSize = descriptors.reduce((totalSize, descriptor) => {
    const { displayPath, size } = descriptor

    const isDTS = displayPath.endsWith('.d.ts')

    const [, fileName] = displayPath.split('/')

    console.log(
      `${displayContext} \x1b[2m${displayPath.replace(fileName, '')}\x1b[22m${isDTS ? '\x1b[32m' : ''}\x1b[1m${fileName.padEnd(13)}\x1b[22m${isDTS ? '\x1b[39m' : ''}  \x1b[2m${toDisplayKBs(
        size,
      )} kB\x1b[22m \x1b[2m│ gzip: ${toDisplayKBs(descriptor.gzipSize)} kB\x1b[22m`,
    )

    return totalSize + descriptor.size
  }, 0)

  console.log(
    `${displayContext} ${descriptors.length} files, total: ${toDisplayKBs(totalSize)} kB`,
  )
}

function toDisplayKBs(bytes: number): string {
  return (bytes / 1_024).toFixed(2)
}

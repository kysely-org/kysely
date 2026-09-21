import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { extname, resolve, sep } from 'pathe'

const buildDir = fileURLToPath(new URL('../build/', import.meta.url))
const { routes } = JSON.parse(
  await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
)

// Support the site's static routing rules, and fail if new routing features
// would otherwise be silently ignored by this local CI server.
const supportedKeys = ['src', 'dest', 'headers', 'methods', 'has', 'continue']
for (const route of routes) {
  if (
    Object.keys(route).some((key) => !supportedKeys.includes(key)) ||
    route.has?.some((condition) => condition.type !== 'header')
  ) {
    throw new Error('Update the afdocs server to support the new Vercel rules')
  }
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

createServer(async (request, response) => {
  try {
    let pathname = new URL(request.url, 'http://localhost').pathname
    const headers = {}

    for (const route of routes) {
      const pattern = new RegExp(route.src)
      if (
        !pattern.test(pathname) ||
        (route.methods && !route.methods.includes(request.method)) ||
        route.has?.some((condition) => {
          const value = request.headers[condition.key.toLowerCase()]
          return (
            typeof value !== 'string' ||
            !new RegExp(`^(?:${condition.value})$`).test(value)
          )
        })
      ) {
        continue
      }

      Object.assign(headers, route.headers)
      if (route.dest) {
        pathname = pathname.replace(pattern, route.dest)
      }
      if (!route.continue) {
        break
      }
    }

    const path = resolve(buildDir, `.${decodeURIComponent(pathname)}`)
    let file
    if (
      path === resolve(buildDir) ||
      path.startsWith(resolve(buildDir) + sep)
    ) {
      for (const candidate of [
        path,
        `${path}.html`,
        resolve(path, 'index.html'),
      ]) {
        if ((await stat(candidate).catch(() => null))?.isFile()) {
          file = candidate
          break
        }
      }
    }

    response.statusCode = file ? 200 : 404
    file ??= resolve(buildDir, '404.html')
    const body = await readFile(file)
    response.setHeader(
      'Content-Type',
      types[extname(file)] ?? 'application/octet-stream',
    )
    for (const [key, value] of Object.entries(headers)) {
      response.setHeader(key, value)
    }
    response.setHeader('Content-Length', body.length)
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch (error) {
    console.error(error)
    response.writeHead(500).end()
  }
}).listen(3000, '127.0.0.1', () => {
  console.log('Serving built agent docs at http://127.0.0.1:3000')
})

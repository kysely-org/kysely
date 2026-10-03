import type { ProcessedDoc, SearchProvider } from 'docusaurus-plugin-mcp-server'
import { createWebRequestHandler } from 'docusaurus-plugin-mcp-server/adapters'
import { decodeHTML } from 'entities'
import docs from '../build/mcp/docs.json' with { type: 'json' }
import manifest from '../build/mcp/manifest.json' with { type: 'json' }
// An explicit .mjs copy keeps Vercel from converting Pagefind to CommonJS.
import { createInstance } from '../build/pagefind/pagefind.mjs'
import searchConfig from '../src/search-config.json' with { type: 'json' }

const APIDOC_BASE_URL = searchConfig.apiDocsUrl
const APIDOC_PAGEFIND_URL = `${APIDOC_BASE_URL}pagefind/`

// Load index chunks from this deployment, while returning canonical doc URLs.
const deploymentUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/`
  : manifest.baseUrl
const pagefind = createInstance({
  basePath: new URL('pagefind/', deploymentUrl).href,
  baseUrl: manifest.baseUrl,
  language: 'en',
})
let ready = false

const search: SearchProvider = {
  name: 'pagefind',
  async initialize() {
    await pagefind.init()
    // Like the website, keep guide search available if the API index is down.
    const apiAvailable = await fetch(
      `${APIDOC_PAGEFIND_URL}pagefind-entry.json`,
      {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      },
    ).then(
      (response) => response.ok,
      () => false,
    )
    if (apiAvailable) {
      await pagefind.mergeIndex(APIDOC_PAGEFIND_URL, {
        baseUrl: APIDOC_BASE_URL,
        indexWeight: searchConfig.apiIndexWeight,
      })
    }
    ready = true
  },
  isReady: () => ready,
  async search(query, { limit = 16 } = {}) {
    const { results } = await pagefind.search(query)
    return Promise.all(
      results.slice(0, limit).map(async (result) => {
        const data = await result.data()
        return {
          url: data.url,
          route: new URL(data.url).pathname,
          title: data.meta.title,
          score: result.score,
          snippet: decodeHTML(data.excerpt.replace(/<\/?mark>/g, '')),
        }
      }),
    )
  },
  async getDocument(input) {
    const url = new URL(input)
    url.hash = ''
    url.search = ''
    const local = (docs as Record<string, ProcessedDoc>)[
      url.pathname === '/' ? url.href : url.href.replace(/\/$/, '')
    ]
    if (local) return local

    // Only fetch API reference pages. Reject redirects to other destinations.
    if (
      !url.href.startsWith(APIDOC_BASE_URL) ||
      !/\.(?:html|md)$/.test(url.pathname)
    ) {
      return null
    }
    const markdownUrl = new URL(url)
    markdownUrl.pathname = markdownUrl.pathname.replace(/\.html$/, '.md')
    const response = await fetch(markdownUrl, {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return null

    const markdown = await response.text()
    return {
      route: url.pathname,
      title: markdown.match(/^# (.+)$/m)?.[1] ?? url.pathname,
      description: '',
      markdown,
      headings: [],
    }
  },
}

export default {
  fetch: createWebRequestHandler({
    docs,
    searchIndexData: {},
    search,
    name: manifest.serverName,
    version: manifest.version,
    baseUrl: manifest.baseUrl,
  }),
}

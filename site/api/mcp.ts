import { load } from 'cheerio'
import type { ProcessedDoc, SearchProvider } from 'docusaurus-plugin-mcp-server'
import { createWebRequestHandler } from 'docusaurus-plugin-mcp-server/adapters'
import TurndownService from 'turndown'
import docs from '../build/mcp/docs.json' with { type: 'json' }
import manifest from '../build/mcp/manifest.json' with { type: 'json' }
import { createInstance } from '../build/pagefind/pagefind.js'
import {
  APIDOC_BASE_URL,
  APIDOC_INDEX_WEIGHT,
  APIDOC_PAGEFIND_URL,
} from '../src/search-config.js'

// Load index chunks from this deployment, while returning canonical doc URLs.
const deploymentUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/`
  : manifest.baseUrl
const pagefind = createInstance({
  basePath: new URL('pagefind/', deploymentUrl).href,
  baseUrl: manifest.baseUrl,
  language: 'en',
})
const markdown = new TurndownService({ codeBlockStyle: 'fenced' })
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
        indexWeight: APIDOC_INDEX_WEIGHT,
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
          snippet: load(data.excerpt).text(),
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
      !url.pathname.endsWith('.html')
    ) {
      return null
    }
    const response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return null

    const $ = load(await response.text())
    const content = $('.col-content')
    if (!content.length) return null
    const title = content.find('h1').first().text()
    content
      .find('h1, button, script, style, .tsd-anchor-icon, .tsd-breadcrumb')
      .remove()
    // TypeDoc uses <br> inside highlighted code; retain its line breaks.
    content.find('pre br').replaceWith('\n')
    content.find('pre > code').each((_, code) => {
      const language = $(code).attr('class')
      if (language) $(code).attr('class', `language-${language}`)
    })
    content.find('a[href]').each((_, link) => {
      $(link).attr('href', new URL($(link).attr('href')!, url).href)
    })
    return {
      route: url.pathname,
      title,
      description: '',
      markdown: markdown.turndown(content.html()!),
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

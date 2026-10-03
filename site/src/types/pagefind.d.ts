// The generated search bundle has no declarations; the pagefind package's
// types describe its build-time indexing API, not this runtime API.
declare module '*build/pagefind/pagefind.js' {
  interface PagefindResult {
    score: number
    data(): Promise<{
      url: string
      meta: { title: string }
      excerpt: string
    }>
  }

  interface PagefindInstance {
    init(): Promise<void>
    mergeIndex(
      path: string,
      options: { baseUrl: string; indexWeight: number },
    ): Promise<void>
    search(query: string): Promise<{ results: PagefindResult[] }>
  }

  export function createInstance(options: {
    basePath: string
    baseUrl: string
    language: string
  }): PagefindInstance
}

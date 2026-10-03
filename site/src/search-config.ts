// Keep the API index on its public origin: probing localhost from the website
// would trigger the browser's Local Network Access permission prompt.
export const APIDOC_BASE_URL = 'https://kysely-org.github.io/kysely-apidoc/'
export const APIDOC_PAGEFIND_URL = `${APIDOC_BASE_URL}pagefind/`

// API pages score much higher than guides for shared terms. Keep guides first
// while still surfacing API results for queries with no guide coverage.
export const APIDOC_INDEX_WEIGHT = 0.03

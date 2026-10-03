import { createWebRequestHandler } from 'docusaurus-plugin-mcp-server/adapters'
import docs from '../build/mcp/docs.json' with { type: 'json' }
import manifest from '../build/mcp/manifest.json' with { type: 'json' }
import searchIndex from '../build/mcp/search-index.json' with { type: 'json' }

export default {
  fetch: createWebRequestHandler({
    docs,
    searchIndexData: searchIndex,
    name: manifest.serverName,
    version: manifest.version,
    baseUrl: manifest.baseUrl,
  }),
}

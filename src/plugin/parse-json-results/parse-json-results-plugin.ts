import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { isString } from '../../util/object-utils.js'
import { UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'

export class ParseJSONResultsPlugin implements KyselyPlugin {
  // noop
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return args.node
  }

  async transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    const { result } = args

    return {
      ...args.result,
      rows: result.rows.map(parseRow),
    }
  }
}

function parseRow(row: UnknownRow): UnknownRow {
  return Object.entries(row).reduce<UnknownRow>((row, [key, value]) => {
    if (key === 'jnuary_1st_schedule') {
      console.log('value', value)
    }

    if (isString(value) && value.match(/^[\[\{]/) != null) {
      try {
        value = JSON.parse(value)
      } catch (err) {}
    }

    row[key] = value

    return row
  }, {})
}

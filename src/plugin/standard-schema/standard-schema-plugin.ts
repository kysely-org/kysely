import type { QueryResult } from '../../driver/database-connection.js'
import type { StandardSchemaV1 } from '../../util/standard-schema.js'
import type { UnknownRow } from '../../util/type-utils.js'
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'

export class StandardSchemaV1Plugin implements KyselyPlugin {
  readonly #schema: StandardSchemaV1

  constructor(schema: StandardSchemaV1) {
    this.#schema = schema
  }

  transformQuery(args: PluginTransformQueryArgs) {
    return args.node
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    const { result } = args
    const { rows } = result

    if (!Array.isArray(rows)) {
      throw new Error(
        'Result is not parseable! Ensure there is no missing returning/output clause or remove `$parseResult` from the chain.',
      )
    }

    return {
      ...result,
      rows: await Promise.all(
        rows.map(async (row, index) => {
          const validated = await this.#schema['~standard'].validate(row)

          const { issues } = validated

          if (issues) {
            throw new AggregateError(
              this.#processIssues(issues),
              `Result row at index ${index} has failed parsing! Checks \`.errors\` for more details.`,
            )
          }

          return validated.value as UnknownRow
        }),
      ),
    }
  }

  #processIssues(issues: readonly StandardSchemaV1.Issue[]): string[] {
    return issues.map(
      ({ message, path }) =>
        `${message}${
          path
            ? ` @ ${path
                .map((segment) =>
                  typeof segment === 'object' ? segment.key : segment,
                )
                .join('->')}`
            : ''
        }`,
    )
  }
}

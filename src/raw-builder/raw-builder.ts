import { QueryResult } from '../driver/database-connection.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import {
  isOperationNodeSource,
  OperationNodeSource,
} from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { parseStringReference } from '../parser/reference-parser.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class RawBuilder<O = unknown> implements OperationNodeSource {
  readonly #props: RawBuilderProps

  constructor(props: RawBuilderProps) {
    this.#props = freeze(props)
  }

  as<A extends string>(alias: A): AliasedRawBuilder<O, A> {
    return new AliasedRawBuilder(this, alias)
  }

  /**
   * Change the output type of the raw expression.
   *
   * This doesn't produce any SQL. This methods simply returns a copy
   * of this `RawBuilder` with a new output type.
   */
  castTo<T>(): RawBuilder<T> {
    return new RawBuilder({
      ...this.#props,
    })
  }

  toOperationNode(): RawNode {
    const bindingRegex = /(\?\??)/g

    const sql = this.#props.sql
    const params = this.#props.params ?? []

    const sqlFragments: string[] = []
    const argNodes: OperationNode[] = []

    let paramIdx = 0
    let sqlIdx = 0
    let match: RegExpExecArray | null = null

    while ((match = bindingRegex.exec(sql))) {
      const str = match[1]

      if (paramIdx >= params.length) {
        throw new Error(`value not provided for all bindings in string ${sql}`)
      }

      if (match.index > 0 && sql[match.index - 1] === '\\') {
        continue
      }

      sqlFragments.push(sql.slice(sqlIdx, match.index).replaceAll('\\?', '?'))
      argNodes.push(parseRawArg(str, params[paramIdx]))

      sqlIdx = match.index + str.length
      ++paramIdx
    }

    sqlFragments.push(sql.slice(sqlIdx))

    const rawNode = RawNode.create(sqlFragments, argNodes)
    return this.#props.executor.transformQuery(rawNode, this.#props.queryId)
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  async execute(): Promise<QueryResult<O>> {
    return this.#props.executor.executeQuery<O>(
      this.compile(),
      this.#props.queryId
    )
  }
}

preventAwait(
  RawBuilder,
  "don't await RawBuilder instances directly. To execute the query you need to call `execute`"
)

/**
 * {@link RawBuilder} with an alias. The result of calling {@link RawBuilder.as}.
 */
export class AliasedRawBuilder<O = unknown, A extends string = never>
  implements OperationNodeSource
{
  readonly #rawBuilder: RawBuilder<O>
  readonly #alias: A

  /**
   * @private
   *
   * This needs to be here just so that the typings work. Without this
   * the generated .d.ts file contains no reference to the type param A
   * which causes this type to be equal to AliasedRawBuilder with any A
   * as long as O is the same.
   */
  protected get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(this.#rawBuilder.toOperationNode(), this.#alias)
  }

  constructor(rawBuilder: RawBuilder<O>, alias: A) {
    this.#rawBuilder = rawBuilder
    this.#alias = alias
  }
}

function parseRawArg(match: string, arg: any): OperationNode {
  if (isOperationNodeSource(arg)) {
    return arg.toOperationNode()
  } else if (match === '??') {
    return parseStringReference(arg)
  } else {
    return ValueNode.create(arg)
  }
}

export interface RawBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly sql: string
  readonly params?: any
}

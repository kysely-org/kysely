import { QueryResult } from '../driver/database-connection'
import { AliasNode, aliasNode } from '../operation-node/alias-node'
import { OperationNode } from '../operation-node/operation-node'
import {
  isOperationNodeSource,
  OperationNodeSource,
} from '../operation-node/operation-node-source'
import { RawNode, rawNode } from '../operation-node/raw-node'
import { valueNode } from '../operation-node/value-node'
import { parseStringReference } from '../parser/reference-parser'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { preventAwait } from '../util/prevent-await'
import { QueryExecutor } from '../util/query-executor'

export class RawBuilder<O = unknown> implements OperationNodeSource {
  #sql: string
  #params?: any[]
  #executor: QueryExecutor

  constructor({ sql, params, executor }: RawBuilderConstructorArgs) {
    this.#sql = sql
    this.#params = params
    this.#executor = executor
  }

  toOperationNode(): RawNode {
    const bindingRegex = /(\?\??)/g

    const sql = this.#sql
    const params = this.#params ?? []

    const sqlFragments: string[] = []
    const argNodes: OperationNode[] = []

    let idx = 0
    let sqlIdx = 0
    let match: RegExpExecArray | null = null

    while ((match = bindingRegex.exec(sql))) {
      const str = match[1]

      if (idx >= params.length) {
        throw new Error(`value not provided for all bindings in string ${sql}`)
      }

      if (match.index > 0 && sql[match.index - 1] === '\\') {
        continue
      }

      sqlFragments.push(sql.slice(sqlIdx, match.index).replaceAll('\\?', '?'))
      argNodes.push(parseRawArg(str, params[idx]))

      sqlIdx = match.index + str.length
      ++idx
    }

    sqlFragments.push(sql.slice(sqlIdx))
    return rawNode.create(sqlFragments, argNodes)
  }

  as<A extends string>(alias: A): AliasedRawBuilder<O, A> {
    return new AliasedRawBuilder(this, alias)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<QueryResult<O>> {
    return this.#executor.executeQuery<O>(this.toOperationNode())
  }
}

preventAwait(
  RawBuilder,
  "don't await RawBuilder instances directly. To execute the query you need to call `execute`"
)

export class AliasedRawBuilder<O = unknown, A extends string = never>
  implements OperationNodeSource
{
  #rawBuilder: RawBuilder<O>
  #alias: A

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
    return aliasNode.create(this.#rawBuilder.toOperationNode(), this.#alias)
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
    return valueNode.create(arg)
  }
}

export interface RawBuilderConstructorArgs {
  sql: string
  params?: any
  executor: QueryExecutor
}

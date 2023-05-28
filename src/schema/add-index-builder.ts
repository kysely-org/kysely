import { Expression } from '../expression/expression.js'
import { AddIndexNode } from '../operation-node/add-index-node.js'
import { IndexType } from '../operation-node/create-index-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  ExtractColumnNameFromOrderedColumnName,
  OrderedColumnName,
  parseOrderedColumnName,
} from '../parser/reference-parser.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryId } from '../util/query-id.js'

export interface AddIndexBuilderInterface<R> {
  unique(): R
  columns<CL extends string>(columns: OrderedColumnName<CL>[]): R
  expression(expression: Expression<any>): R
  using(indexType: IndexType): R
  using(indexType: string): R
}

export class AddIndexBuilder<C = never>
  implements AddIndexBuilderInterface<AddIndexBuilder>, OperationNodeSource
{
  readonly #props: AddIndexBuilderProps

  constructor(props: AddIndexBuilderProps) {
    this.#props = freeze(props)
  }

  unique(): AddIndexBuilder<C> {
    return new AddIndexBuilder({
      ...this.#props,
      node: AddIndexNode.cloneWith(this.#props.node, {
        unique: true,
      }),
    })
  }

  column<CL extends string>(
    column: OrderedColumnName<CL>
  ): AddIndexBuilder<C | ExtractColumnNameFromOrderedColumnName<CL>> {
    return new AddIndexBuilder({
      ...this.#props,
      node: AddIndexNode.cloneWithColumns(this.#props.node, [
        parseOrderedColumnName(column),
      ]),
    })
  }

  columns<CL extends string>(
    columns: OrderedColumnName<CL>[]
  ): AddIndexBuilder<C | ExtractColumnNameFromOrderedColumnName<CL>> {
    return new AddIndexBuilder({
      ...this.#props,
      node: AddIndexNode.cloneWithColumns(
        this.#props.node,
        columns.map(parseOrderedColumnName)
      ),
    })
  }

  expression(expression: Expression<any>): AddIndexBuilder<C> {
    return new AddIndexBuilder({
      ...this.#props,
      node: AddIndexNode.cloneWithColumns(this.#props.node, [
        expression.toOperationNode(),
      ]),
    })
  }

  using(indexType: IndexType): AddIndexBuilder<C>
  using(indexType: string): AddIndexBuilder<C>
  using(indexType: string): AddIndexBuilder<C> {
    return new AddIndexBuilder({
      ...this.#props,
      node: AddIndexNode.cloneWith(this.#props.node, {
        using: RawNode.createWithSql(indexType),
      }),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): AddIndexNode {
    return this.#props.node
  }
}

export interface AddIndexBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AddIndexNode
}

preventAwait(AddIndexBuilder, "don't await AddIndexBuilder instances directly.")

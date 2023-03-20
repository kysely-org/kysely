import {
  CreateIndexNode,
  IndexType,
} from '../operation-node/create-index-node.js'
import { ListNode } from '../operation-node/list-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { parseColumnName } from '../parser/reference-parser.js'
import { parseTable } from '../parser/table-parser.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { Expression } from '../expression/expression.js'
import {
  ComparisonOperatorExpression,
  parseWhere,
} from '../parser/binary-operation-parser.js'
import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { QueryNode } from '../operation-node/query-node.js'

export class CreateIndexBuilder<C = never>
  implements OperationNodeSource, Compilable, CreateIndexWhereInterface<C>
{
  readonly #props: CreateIndexBuilderProps

  constructor(props: CreateIndexBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the "if not exists" modifier.
   *
   * If the index already exists, no error is thrown if this method has been called.
   */
  ifNotExists(): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        ifNotExists: true,
      }),
    })
  }

  /**
   * Makes the index unique.
   */
  unique(): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        unique: true,
      }),
    })
  }

  /**
   * Specifies the table for the index.
   */
  on(table: string): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        table: parseTable(table),
      }),
    })
  }

  /**
   * Specifies the column for the index.
   *
   * Also see the `expression` for specifying an arbitrary expression.
   */
  column<CL extends string>(column: CL): CreateIndexBuilder<C | CL> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        expression: parseColumnName(column),
      }),
    })
  }

  /**
   * Specifies a list of columns for the index.
   *
   * Also see the `expression` for specifying an arbitrary expression.
   */
  columns<CL extends string[]>(
    columns: CL
  ): CreateIndexBuilder<C | CL[number]> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        expression: ListNode.create(columns.map(parseColumnName)),
      }),
    })
  }

  /**
   * Specifies an arbitrary expression for the index.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createIndex('person_first_name_index')
   *   .on('person')
   *   .expression(sql`first_name COLLATE "fi_FI"`)
   *   .execute()
   * ```
   */
  expression(expression: Expression<any>): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        expression: expression.toOperationNode(),
      }),
    })
  }

  /**
   * Specifies the index type.
   */
  using(indexType: IndexType): CreateIndexBuilder<C>
  using(indexType: string): CreateIndexBuilder<C>
  using(indexType: string): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        using: RawNode.createWithSql(indexType),
      }),
    })
  }

  where(
    lhs: C | DynamicReferenceBuilder<any> | Expression<any>,
    op: ComparisonOperatorExpression,
    rhs: unknown
  ): CreateIndexBuilder<C>
  where(
    grouper: (qb: CreateIndexWhereInterface<C>) => CreateIndexWhereInterface<C>
  ): CreateIndexBuilder<C>
  where(expression: Expression<any>): CreateIndexBuilder<C>

  where(...args: any[]): any {
    return new CreateIndexBuilder({
      ...this.#props,
      node: QueryNode.cloneWithWhere(this.#props.node as any, parseWhere(args)),
    })
  }

  orWhere(
    lhs: C | DynamicReferenceBuilder<any> | Expression<any>,
    op: ComparisonOperatorExpression,
    rhs: unknown
  ): CreateIndexBuilder<C>
  orWhere(
    grouper: (qb: CreateIndexWhereInterface<C>) => CreateIndexWhereInterface<C>
  ): CreateIndexBuilder<C>
  orWhere(expression: Expression<any>): CreateIndexBuilder<C>

  orWhere(...args: any[]): any {
    return new CreateIndexBuilder({
      ...this.#props,
      node: QueryNode.cloneWithOrWhere(
        this.#props.node as any,
        parseWhere(args)
      ),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): CreateIndexNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), this.#props.queryId)
  }
}

preventAwait(
  CreateIndexBuilder,
  "don't await CreateIndexBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateIndexBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: CreateIndexNode
}

// WhereInterface but without database schema type definition generics, just available column names.
export interface CreateIndexWhereInterface<C> {
  where(
    lhs: C | DynamicReferenceBuilder<any> | Expression<any>,
    op: ComparisonOperatorExpression,
    rhs: unknown
  ): CreateIndexBuilder<C>
  where(
    grouper: (qb: CreateIndexWhereInterface<C>) => CreateIndexWhereInterface<C>
  ): CreateIndexBuilder<C>
  where(expression: Expression<any>): CreateIndexBuilder<C>

  orWhere(
    lhs: C | DynamicReferenceBuilder<any> | Expression<any>,
    op: ComparisonOperatorExpression,
    rhs: unknown
  ): CreateIndexBuilder<C>
  orWhere(
    grouper: (qb: CreateIndexWhereInterface<C>) => CreateIndexWhereInterface<C>
  ): CreateIndexBuilder<C>
  orWhere(expression: Expression<any>): CreateIndexBuilder<C>
}

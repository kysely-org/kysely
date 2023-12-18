import { CreateTriggerNode } from '../operation-node/create-trigger-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { QueryNode } from '../operation-node/query-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseValueBinaryOperationOrExpression,
} from '../parser/binary-operation-parser.js'
import {
  ReferenceExpression,
  parseOrderedColumnName,
  parseReferenceExpressionOrList,
} from '../parser/reference-parser.js'
import { ImmediateValueTransformer } from '../plugin/immediate-value/immediate-value-transformer.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'
import { AnyColumn, AnyColumnWithTable, SqlBool } from '../util/type-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { TriggerOrderNode } from '../operation-node/trigger-order-node.js'
import {
  TriggerEvent,
  TriggerEventNode,
} from '../operation-node/trigger-event-node.js'
import { FunctionNode } from '../operation-node/function-node.js'
import { ExpressionOrFactory } from '../parser/expression-parser.js'
import { TriggerQueryCreator } from '../trigger-query-creator.js'
import { TableNode } from '../operation-node/table-node.js'

export type DatabaseWithOldNewTables<DB, TB extends keyof DB> = DB & {
  old: DB[TB]
  new: DB[TB]
}

/**
 * This builder can be used to create a `create table` query.
 */
export class CreateTriggerBuilder<DB, TB extends keyof DB>
  implements OperationNodeSource, Compilable
{
  readonly #props: CreateTriggerBuilderProps

  constructor(props: CreateTriggerBuilderProps) {
    this.#props = freeze(props)
  }

  before(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        time: 'before',
      }),
    })
  }

  after(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        time: 'after',
      }),
    })
  }

  insteadOf(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        time: 'instead of',
      }),
    })
  }

  addEvent<E extends TriggerEvent>(
    event: E,
    columns?: E extends 'update' ? AnyColumn<DB, TB>[] : never[]
  ): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWithEvent(
        this.#props.node,
        TriggerEventNode.create(event, columns?.map(parseOrderedColumnName))
      ),
    })
  }

  forEachRow(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        forEach: `row`,
      }),
    })
  }

  forEachStatement(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        forEach: `statement`,
      }),
    })
  }

  follows(otherTriggerName: string): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        order: TriggerOrderNode.create(
          'follows',
          IdentifierNode.create(otherTriggerName)
        ),
      }),
    })
  }

  precedes(otherTriggerName: string): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        order: TriggerOrderNode.create(
          'precedes',
          IdentifierNode.create(otherTriggerName)
        ),
      }),
    })
  }

  /**
   * Specifies the table for the trigger.
   */
  onTable<TE extends keyof DB & string>(
    table: TE,
    schema?: string
  ): CreateTriggerBuilder<DB, TE> {
    return new CreateTriggerBuilder<DB, TE>({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        table: schema
          ? TableNode.createWithSchema(schema, table)
          : TableNode.create(table),
      }),
    })
  }

  /**
   * Adds the "temporary" modifier.
   *
   * Use this to create a temporary trigger.
   */
  temporary(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        temporary: true,
      }),
    })
  }

  /**
   * Adds the "if not exists" modifier.
   *
   * If the trigger already exists, no error is thrown if this method has been called.
   */
  ifNotExists(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        ifNotExists: true,
      }),
    })
  }

  /**
   * Only supported on PostgreSQL
   */
  orReplace(): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        orReplace: true,
      }),
    })
  }

  /**
   * Adds a query to the trigger.
   */
  addQuery(build: QueryCreatorCallback<DB, TB>): CreateTriggerBuilder<DB, TB> {
    const node = build(
      new TriggerQueryCreator({ executor: this.#props.executor })
    ).toOperationNode()

    if (!QueryNode.is(node)) throw new Error('Must be a query node.')

    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWithQuery(this.#props.node, node),
    })
  }

  function(
    name: string,
    args: ReadonlyArray<ReferenceExpression<any, any>>
  ): CreateTriggerBuilder<DB, TB> {
    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        function: FunctionNode.create(
          name,
          parseReferenceExpressionOrList(args)
        ),
      }),
    })
  }

  when<
    RE extends AnyColumnWithTable<
      DatabaseWithOldNewTables<DB, TB>,
      'old' | 'new'
    >
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): CreateTriggerBuilder<DB, TB>
  when(
    factory: ExpressionOrFactory<
      DatabaseWithOldNewTables<DB, TB>,
      'old' | 'new',
      SqlBool
    >
  ): CreateTriggerBuilder<DB, TB>

  when(...args: any[]): any {
    const transformer = new ImmediateValueTransformer()

    return new CreateTriggerBuilder({
      ...this.#props,
      node: CreateTriggerNode.cloneWith(this.#props.node, {
        when: transformer.transformNode(
          parseValueBinaryOperationOrExpression(args)
        ),
      }),
    })
  }

  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): CreateTriggerNode {
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
  CreateTriggerBuilder,
  "don't await CreateTriggerBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateTriggerBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: CreateTriggerNode
}

export type QueryCreatorCallback<DB, TB extends keyof DB> = (
  creator: TriggerQueryCreator<DB, TB>
) => OperationNodeSource

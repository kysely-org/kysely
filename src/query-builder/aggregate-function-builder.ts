import { freeze } from '../util/object-utils.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { preventAwait } from '../util/prevent-await.js'
import { OverBuilder } from './over-builder.js'
import { createOverBuilder } from '../parser/parse-utils.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ComparisonOperator } from '../operation-node/operator-node.js'
import {
  OperandValueExpressionOrList,
  parseReferentialFilter,
  parseWhere,
  WhereGrouper,
} from '../parser/binary-operation-parser.js'
import {
  ExistsExpression,
  parseExists,
  parseNotExists,
} from '../parser/unary-operation-parser.js'

export class AggregateFunctionBuilder<DB, TB extends keyof DB, O = unknown>
  implements Expression<O>
{
  readonly #props: AggregateFunctionBuilderProps

  constructor(props: AggregateFunctionBuilderProps) {
    this.#props = freeze(props)
  }

  /** @private */
  get expressionType(): O | undefined {
    return undefined
  }

  /**
   * Returns an aliased version of the function.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.count<number>('id').as('person_count')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `person_count: number` field exists in the result type.
   * console.log(result.person_count)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count("id") as "person_count"
   * from "person"
   * ```
   */
  as<A extends string>(
    alias: A
  ): AliasedAggregateFunctionBuilder<DB, TB, O, A> {
    return new AliasedAggregateFunctionBuilder(this, alias)
  }

  /**
   * Adds a distinct clause inside the function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.count<number>('first_name').distinct().as('first_name_count')
   *   )
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count(distinct "first_name") as "first_name_count"
   * from "person"
   * ```
   */
  distinct(): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithDistinct(
        this.#props.aggregateFunctionNode
      ),
    })
  }

  /**
   * // TODO: ...
   */
  filterWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): AggregateFunctionBuilder<DB, TB, O>

  filterWhere(
    grouper: WhereGrouper<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O>
  filterWhere(expression: Expression<any>): AggregateFunctionBuilder<DB, TB, O>

  filterWhere(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseWhere(args)
      ),
    })
  }

  /**
   * TODO: ...
   */
  filterWhereExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseExists(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  filterWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseNotExists(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  filterWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperator,
    rhs: ReferenceExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseReferentialFilter(lhs, op, rhs)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilterWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): AggregateFunctionBuilder<DB, TB, O>

  orFilterWhere(
    grouper: WhereGrouper<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O>
  orFilterWhere(
    expression: Expression<any>
  ): AggregateFunctionBuilder<DB, TB, O>

  orFilterWhere(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseWhere(args)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilterWhereExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseExists(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilterWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseNotExists(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilterWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperator,
    rhs: ReferenceExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseReferentialFilter(lhs, op, rhs)
      ),
    })
  }

  /**
   * Adds an over clause (window functions) after the function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.avg<number>('age').over().as('average_age')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select avg("age") over() as "average_age"
   * from "person"
   * ```
   *
   * Also supports passing a callback that returns an over builder,
   * allowing to add partition by and sort by clauses inside over.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.avg<number>('age').over(
   *       ob => ob.partitionBy('last_name').orderBy('first_name', 'asc')
   *     ).as('average_age')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select avg("age") over(partition by "last_name" order by "first_name" asc) as "average_age"
   * from "person"
   * ```
   */
  over(
    over?: OverBuilderCallback<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    const builder = createOverBuilder()

    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOver(
        this.#props.aggregateFunctionNode,
        (over ? over(builder) : builder).toOperationNode()
      ),
    })
  }

  toOperationNode(): AggregateFunctionNode {
    return this.#props.aggregateFunctionNode
  }
}

preventAwait(
  AggregateFunctionBuilder,
  "don't await AggregateFunctionBuilder instances. They are never executed directly and are always just a part of a query."
)

/**
 * {@link AggregateFunctionBuilder} with an alias. The result of calling {@link AggregateFunctionBuilder.as}.
 */
export class AliasedAggregateFunctionBuilder<
  DB,
  TB extends keyof DB,
  O = unknown,
  A extends string = never
> implements AliasedExpression<O, A>
{
  readonly #aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>
  readonly #alias: A

  constructor(
    aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>,
    alias: A
  ) {
    this.#aggregateFunctionBuilder = aggregateFunctionBuilder
    this.#alias = alias
  }

  /** @private */
  get expression(): Expression<O> {
    return this.#aggregateFunctionBuilder
  }

  /** @private */
  get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#aggregateFunctionBuilder.toOperationNode(),
      IdentifierNode.create(this.#alias)
    )
  }
}

export interface AggregateFunctionBuilderProps {
  aggregateFunctionNode: AggregateFunctionNode
}

export type OverBuilderCallback<DB, TB extends keyof DB> = (
  builder: OverBuilder<DB, TB>
) => OverBuilder<DB, TB>

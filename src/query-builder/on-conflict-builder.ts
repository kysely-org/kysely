import { Expression } from '../expression/expression.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OnConflictNode } from '../operation-node/on-conflict-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseFilter,
  parseReferentialComparison,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import {
  UpdateExpression,
  parseUpdateExpression,
} from '../parser/update-set-parser.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { AnyColumn } from '../util/type-utils.js'
import { WhereExpressionFactory, WhereInterface } from './where-interface.js'

export class OnConflictBuilder<DB, TB extends keyof DB>
  implements WhereInterface<DB, TB>
{
  readonly #props: OnConflictBuilderProps

  constructor(props: OnConflictBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Specify a single column as the conflict target.
   *
   * Also see the {@link columns}, {@link constraint} and {@link expression}
   * methods for alternative ways to specify the conflict target.
   */
  column(column: AnyColumn<DB, TB>): OnConflictBuilder<DB, TB> {
    const columnNode = ColumnNode.create(column)

    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWith(this.#props.onConflictNode, {
        columns: this.#props.onConflictNode.columns
          ? freeze([...this.#props.onConflictNode.columns, columnNode])
          : freeze([columnNode]),
      }),
    })
  }

  /**
   * Specify a list of columns as the conflict target.
   *
   * Also see the {@link column}, {@link constraint} and {@link expression}
   * methods for alternative ways to specify the conflict target.
   */
  columns(
    columns: ReadonlyArray<AnyColumn<DB, TB>>
  ): OnConflictBuilder<DB, TB> {
    const columnNodes = columns.map(ColumnNode.create)

    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWith(this.#props.onConflictNode, {
        columns: this.#props.onConflictNode.columns
          ? freeze([...this.#props.onConflictNode.columns, ...columnNodes])
          : freeze(columnNodes),
      }),
    })
  }

  /**
   * Specify a specific constraint by name as the conflict target.
   *
   * Also see the {@link column}, {@link columns} and {@link expression}
   * methods for alternative ways to specify the conflict target.
   */
  constraint(constraintName: string): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWith(this.#props.onConflictNode, {
        constraint: IdentifierNode.create(constraintName),
      }),
    })
  }

  /**
   * Specify an expression as the conflict target.
   *
   * This can be used if the unique index is an expression index.
   *
   * Also see the {@link column}, {@link columns} and {@link constraint}
   * methods for alternative ways to specify the conflict target.
   */
  expression(expression: Expression<any>): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWith(this.#props.onConflictNode, {
        indexExpression: expression.toOperationNode(),
      }),
    })
  }

  /**
   * Specify an index predicate for the index target.
   *
   * See {@link WhereInterface.where} for more info.
   */
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): OnConflictBuilder<DB, TB>

  where(factory: WhereExpressionFactory<DB, TB>): OnConflictBuilder<DB, TB>
  where(expression: Expression<any>): OnConflictBuilder<DB, TB>

  where(...args: any[]): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithIndexWhere(
        this.#props.onConflictNode,
        parseFilter(args)
      ),
    })
  }

  /**
   * Specify an index predicate for the index target.
   *
   * See {@link WhereInterface.whereRef} for more info.
   */
  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithIndexWhere(
        this.#props.onConflictNode,
        parseReferentialComparison(lhs, op, rhs)
      ),
    })
  }

  clearWhere(): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder<DB, TB>({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithoutIndexWhere(
        this.#props.onConflictNode
      ),
    })
  }

  /**
   * Adds the "do nothing" conflict action.
   *
   * ### Examples
   *
   * ```ts
   * await db
   *   .insertInto('person')
   *   .values({ first_name, pic })
   *   .onConflict((oc) => oc
   *     .column('pic')
   *     .doNothing()
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * insert into "person" ("first_name", "pic")
   * values ($1, $2)
   * on conflict ("pic") do nothing
   * ```
   */
  doNothing(): OnConflictDoNothingBuilder<DB, TB> {
    return new OnConflictDoNothingBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWith(this.#props.onConflictNode, {
        doNothing: true,
      }),
    })
  }

  /**
   * Adds the "do update set" conflict action.
   *
   * ### Examples
   *
   * ```ts
   * await db
   *   .insertInto('person')
   *   .values({ first_name, pic })
   *   .onConflict((oc) => oc
   *     .column('pic')
   *     .doUpdateSet({ first_name })
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * insert into "person" ("first_name", "pic")
   * values ($1, $2)
   * on conflict ("pic")
   * do update set "first_name" = $3
   * ```
   *
   * In the next example we use the `ref` method to reference
   * columns of the virtual table `excluded` in a type-safe way
   * to create an upsert operation:
   *
   * ```ts
   * db.insertInto('person')
   *   .values(person)
   *   .onConflict((oc) => oc
   *     .column('id')
   *     .doUpdateSet((eb) => ({
   *       first_name: eb.ref('excluded.first_name'),
   *       last_name: eb.ref('excluded.last_name')
   *     }))
   *   )
   * ```
   */
  doUpdateSet(
    update: UpdateExpression<
      OnConflictDatabase<DB, TB>,
      OnConflictTables<TB>,
      OnConflictTables<TB>
    >
  ): OnConflictUpdateBuilder<OnConflictDatabase<DB, TB>, OnConflictTables<TB>> {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWith(this.#props.onConflictNode, {
        updates: parseUpdateExpression(update),
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
}

export interface OnConflictBuilderProps {
  readonly onConflictNode: OnConflictNode
}

preventAwait(OnConflictBuilder, "don't await OnConflictBuilder instances.")

export type OnConflictDatabase<DB, TB extends keyof DB> = {
  [K in keyof DB | 'excluded']: K extends keyof DB ? DB[K] : DB[TB]
}

export type OnConflictTables<TB> = TB | 'excluded'

export class OnConflictDoNothingBuilder<DB, TB extends keyof DB>
  implements OperationNodeSource
{
  readonly #props: OnConflictBuilderProps

  constructor(props: OnConflictBuilderProps) {
    this.#props = freeze(props)
  }

  toOperationNode(): OnConflictNode {
    return this.#props.onConflictNode
  }
}

preventAwait(
  OnConflictDoNothingBuilder,
  "don't await OnConflictDoNothingBuilder instances."
)

export class OnConflictUpdateBuilder<DB, TB extends keyof DB>
  implements WhereInterface<DB, TB>, OperationNodeSource
{
  readonly #props: OnConflictBuilderProps

  constructor(props: OnConflictBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Specify a where condition for the update operation.
   *
   * See {@link WhereInterface.where} for more info.
   */
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): OnConflictUpdateBuilder<DB, TB>

  where(
    factory: WhereExpressionFactory<DB, TB>
  ): OnConflictUpdateBuilder<DB, TB>

  where(expression: Expression<any>): OnConflictUpdateBuilder<DB, TB>

  where(...args: any[]): OnConflictUpdateBuilder<DB, TB> {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithUpdateWhere(
        this.#props.onConflictNode,
        parseFilter(args)
      ),
    })
  }

  /**
   * Specify a where condition for the update operation.
   *
   * See {@link WhereInterface.whereRef} for more info.
   */
  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): OnConflictUpdateBuilder<DB, TB> {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithUpdateWhere(
        this.#props.onConflictNode,
        parseReferentialComparison(lhs, op, rhs)
      ),
    })
  }

  clearWhere(): OnConflictUpdateBuilder<DB, TB> {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithoutUpdateWhere(
        this.#props.onConflictNode
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

  toOperationNode(): OnConflictNode {
    return this.#props.onConflictNode
  }
}

preventAwait(
  OnConflictUpdateBuilder,
  "don't await OnConflictUpdateBuilder instances."
)

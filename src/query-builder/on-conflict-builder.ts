import type { Expression } from '../expression/expression.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OnConflictNode } from '../operation-node/on-conflict-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  type ComparisonOperatorExpression,
  type OperandValueExpressionOrList,
  parseValueBinaryOperationOrExpression,
  parseReferentialBinaryOperation,
} from '../parser/binary-operation-parser.js'
import type { ExpressionOrFactory } from '../parser/expression-parser.js'
import type { ReferenceExpression } from '../parser/reference-parser.js'
import {
  type UpdateObjectExpression,
  parseUpdateObjectExpression,
} from '../parser/update-set-parser.js'
import type { Selectable, Updateable } from '../util/column-type.js'
import { freeze } from '../util/object-utils.js'
import type { AnyColumn, SqlBool } from '../util/type-utils.js'
import type { WhereInterface } from './where-interface.js'

export class OnConflictBuilder<
  DB,
  TB extends keyof DB,
> implements WhereInterface<DB, TB> {
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
    columns: ReadonlyArray<AnyColumn<DB, TB>>,
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

  where<
    RE extends ReferenceExpression<DB, TB>,
    VE extends OperandValueExpressionOrList<DB, TB, RE>,
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: VE,
  ): OnConflictBuilder<DB, TB>

  where<E extends ExpressionOrFactory<DB, TB, SqlBool>>(
    expression: E,
  ): OnConflictBuilder<DB, TB>

  where(...args: any[]): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithIndexWhere(
        this.#props.onConflictNode,
        parseValueBinaryOperationOrExpression(args),
      ),
    })
  }

  whereRef<
    LRE extends ReferenceExpression<DB, TB>,
    RRE extends ReferenceExpression<DB, TB>,
  >(
    lhs: LRE,
    op: ComparisonOperatorExpression,
    rhs: RRE,
  ): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithIndexWhere(
        this.#props.onConflictNode,
        parseReferentialBinaryOperation(lhs, op, rhs),
      ),
    })
  }

  clearWhere(): OnConflictBuilder<DB, TB> {
    return new OnConflictBuilder<DB, TB>({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithoutIndexWhere(
        this.#props.onConflictNode,
      ),
    })
  }

  /**
   * Adds the "do nothing" conflict action.
   *
   * ### Examples
   *
   * ```ts
   * const id = 1
   * const first_name = 'John'
   *
   * await db
   *   .insertInto('person')
   *   .values({ first_name, id })
   *   .onConflict((oc) => oc
   *     .column('id')
   *     .doNothing()
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * insert into "person" ("first_name", "id")
   * values ($1, $2)
   * on conflict ("id") do nothing
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
   * const id = 1
   * const first_name = 'John'
   *
   * await db
   *   .insertInto('person')
   *   .values({ first_name, id })
   *   .onConflict((oc) => oc
   *     .column('id')
   *     .doUpdateSet({ first_name })
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * insert into "person" ("first_name", "id")
   * values ($1, $2)
   * on conflict ("id")
   * do update set "first_name" = $3
   * ```
   *
   * In the next example we use the `ref` method to reference
   * columns of the virtual table `excluded` in a type-safe way
   * to create an upsert operation:
   *
   * ```ts
   * import type { NewPerson } from 'type-editor' // imaginary module
   *
   * async function upsertPerson(person: NewPerson): Promise<void> {
   *   await db.insertInto('person')
   *     .values(person)
   *     .onConflict((oc) => oc
   *       .column('id')
   *       .doUpdateSet((eb) => ({
   *         first_name: eb.ref('excluded.first_name'),
   *         last_name: eb.ref('excluded.last_name')
   *       })
   *     )
   *   )
   *   .execute()
   * }
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * insert into "person" ("first_name", "last_name")
   * values ($1, $2)
   * on conflict ("id")
   * do update set
   *  "first_name" = excluded."first_name",
   *  "last_name" = excluded."last_name"
   * ```
   */
  doUpdateSet(
    update: UpdateObjectExpression<
      OnConflictDatabase<DB, TB>,
      OnConflictTables<TB>,
      OnConflictTables<TB>
    >,
  ): OnConflictUpdateBuilder<
    OnConflictDatabase<DB, TB>,
    OnConflictTables<TB>,
    OnConflictSelectDatabase<DB, TB>
  > {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWith(this.#props.onConflictNode, {
        updates: parseUpdateObjectExpression(update),
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

export type OnConflictDatabase<DB, TB extends keyof DB> = {
  [K in keyof DB | 'excluded']: Updateable<K extends keyof DB ? DB[K] : DB[TB]>
}

/**
 * Like {@link OnConflictDatabase} but maps all table columns to their selectable
 * (read) types instead of updateable types. Used for the `where` clause of
 * `ON CONFLICT DO UPDATE` so that non-updateable columns (e.g. generated/read-only
 * columns typed as `ColumnType<T, never, never>`) can still be referenced in filter
 * expressions.
 */
export type OnConflictSelectDatabase<DB, TB extends keyof DB> = {
  [K in keyof DB | 'excluded']: Selectable<K extends keyof DB ? DB[K] : DB[TB]>
}

export type OnConflictTables<TB> = TB | 'excluded'

export class OnConflictDoNothingBuilder<
  DB,
  TB extends keyof DB,
> implements OperationNodeSource {
  readonly #props: OnConflictBuilderProps

  constructor(props: OnConflictBuilderProps) {
    this.#props = freeze(props)
  }

  toOperationNode(): OnConflictNode {
    return this.#props.onConflictNode
  }
}

/**
 * `DB` is the updateable-only database (used by `doUpdateSet`).
 * `TB` is the union of table names available in this context.
 * `SDB` is the selectable database used for `where`/`whereRef` so that
 * non-updateable columns (e.g. `GeneratedAlways`) can still be referenced
 * in filter expressions. Defaults to `DB` for backward compatibility when
 * the builder is constructed without an explicit select database.
 */
export class OnConflictUpdateBuilder<DB, TB extends keyof DB, SDB extends Record<TB & keyof SDB, any> = DB>
  implements WhereInterface<SDB, TB & keyof SDB>, OperationNodeSource
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
  where<
    RE extends ReferenceExpression<SDB, TB & keyof SDB>,
    VE extends OperandValueExpressionOrList<SDB, TB & keyof SDB, RE>,
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: VE,
  ): OnConflictUpdateBuilder<DB, TB, SDB>

  where<E extends ExpressionOrFactory<SDB, TB & keyof SDB, SqlBool>>(
    expression: E,
  ): OnConflictUpdateBuilder<DB, TB, SDB>

  where(...args: any[]): OnConflictUpdateBuilder<DB, TB, SDB> {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithUpdateWhere(
        this.#props.onConflictNode,
        parseValueBinaryOperationOrExpression(args),
      ),
    })
  }

  /**
   * Specify a where condition for the update operation.
   *
   * See {@link WhereInterface.whereRef} for more info.
   */
  whereRef<
    LRE extends ReferenceExpression<SDB, TB & keyof SDB>,
    RRE extends ReferenceExpression<SDB, TB & keyof SDB>,
  >(
    lhs: LRE,
    op: ComparisonOperatorExpression,
    rhs: RRE,
  ): OnConflictUpdateBuilder<DB, TB, SDB> {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithUpdateWhere(
        this.#props.onConflictNode,
        parseReferentialBinaryOperation(lhs, op, rhs),
      ),
    })
  }

  clearWhere(): OnConflictUpdateBuilder<DB, TB, SDB> {
    return new OnConflictUpdateBuilder({
      ...this.#props,
      onConflictNode: OnConflictNode.cloneWithoutUpdateWhere(
        this.#props.onConflictNode,
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

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

  /**
   * Makes the index unique.
   */
  unique(): AddIndexBuilder<C> {
    return new AddIndexBuilder({
      ...this.#props,
      node: AddIndexNode.cloneWith(this.#props.node, {
        unique: true,
      }),
    })
  }

  /**
   * Adds a column to the index.
   *
   * Also see {@link columns} for adding multiple columns at once or {@link expression}
   * for specifying an arbitrary expression.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *         .alterTable('person')
   *         .createIndex('person_first_name_and_age_index')
   *         .column('first_name')
   *         .column('age desc')
   *         .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add index `person_first_name_and_age_index` (`first_name`, `age` desc)
   * ```
   */
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

  /**
   * Specifies a list of columns for the index.
   *
   * Also see {@link column} for adding a single column or {@link expression} for
   * specifying an arbitrary expression.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *         .alterTable('person')
   *         .addIndex('person_first_name_and_age_index')
   *         .columns(['first_name', 'age desc'])
   *         .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add index `person_first_name_and_age_index` (`first_name`, `age` desc)
   * ```
   */
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

  /**
   * Specifies an arbitrary expression for the index.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .alterTable('person')
   *   .addIndex('person_first_name_index')
   *   .expression(sql`(first_name < 'Sami')`)
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add index `person_first_name_index` ((first_name < 'Sami'))
   * ```
   */
  expression(expression: Expression<any>): AddIndexBuilder<C> {
    return new AddIndexBuilder({
      ...this.#props,
      node: AddIndexNode.cloneWithColumns(this.#props.node, [
        expression.toOperationNode(),
      ]),
    })
  }

  /**
   * Specifies the index type.
   */
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

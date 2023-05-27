import { Expression } from '../expression/expression.js'
import { AddIndexNode } from '../operation-node/add-index-node.js'
import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { IndexType } from '../operation-node/create-index-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OrderedColumnName } from '../parser/reference-parser.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryId } from '../util/query-id.js'
import {
  AddIndexBuilder,
  AddIndexBuilderInterface,
} from './add-index-builder.js'

export class AlterTableAddIndexBuilder
  implements
    AddIndexBuilderInterface<AlterTableAddIndexBuilder>,
    OperationNodeSource,
    Compilable
{
  readonly #props: AlterTableAddIndexBuilderProps

  constructor(props: AlterTableAddIndexBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Makes the index unique.
   */
  unique(): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      indexBuilder: this.#props.indexBuilder.unique(),
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
  ): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      indexBuilder: this.#props.indexBuilder.column(column),
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
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * alter table `person` add index `person_first_name_and_age_index` (`first_name`, `age` desc)
   * ```
   */
  columns<CL extends string>(
    columns: OrderedColumnName<CL>[]
  ): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      indexBuilder: this.#props.indexBuilder.columns(columns),
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
  expression(expression: Expression<any>): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      indexBuilder: this.#props.indexBuilder.expression(expression),
    })
  }

  /**
   * Specifies the index type.
   */
  using(indexType: IndexType): AlterTableAddIndexBuilder
  using(indexType: string): AlterTableAddIndexBuilder
  using(indexType: string): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      indexBuilder: this.#props.indexBuilder.using(indexType),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      AlterTableNode.cloneWithTableProps(this.#props.node, {
        addIndex: AddIndexNode.create(
          this.#props.indexBuilder.toOperationNode()
        ),
      }),
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

export interface AlterTableAddIndexBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTableNode
  readonly indexBuilder: AddIndexBuilder
}

preventAwait(
  AlterTableAddIndexBuilder,
  "don't await AlterTableAddIndexBuilder instances directly. To execute the query you need to call `execute`"
)

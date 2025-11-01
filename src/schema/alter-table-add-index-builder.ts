import { Expression } from '../expression/expression.js'
import { AddIndexNode } from '../operation-node/add-index-node.js'
import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { IndexType } from '../operation-node/create-index-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  OrderedColumnName,
  parseOrderedColumnName,
} from '../parser/reference-parser.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { AbortableOperationOptions } from '../util/abort.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'

export class AlterTableAddIndexBuilder
  implements OperationNodeSource, Compilable
{
  readonly #props: AlterTableAddIndexBuilderProps

  constructor(props: AlterTableAddIndexBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Makes the index unique.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .alterTable('person')
   *   .addIndex('person_first_name_index')
   *   .unique()
   *   .column('email')
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add unique index `person_first_name_index` (`email`)
   * ```
   */
  unique(): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addIndex: AddIndexNode.cloneWith(this.#props.node.addIndex!, {
          unique: true,
        }),
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
   *   .alterTable('person')
   *   .addIndex('person_first_name_and_age_index')
   *   .column('first_name')
   *   .column('age desc')
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add index `person_first_name_and_age_index` (`first_name`, `age` desc)
   * ```
   */
  column<CL extends string>(
    column: OrderedColumnName<CL>,
  ): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addIndex: AddIndexNode.cloneWithColumns(this.#props.node.addIndex!, [
          parseOrderedColumnName(column),
        ]),
      }),
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
   *   .alterTable('person')
   *   .addIndex('person_first_name_and_age_index')
   *   .columns(['first_name', 'age desc'])
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add index `person_first_name_and_age_index` (`first_name`, `age` desc)
   * ```
   */
  columns<CL extends string>(
    columns: OrderedColumnName<CL>[],
  ): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addIndex: AddIndexNode.cloneWithColumns(
          this.#props.node.addIndex!,
          columns.map(parseOrderedColumnName),
        ),
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
   *   .alterTable('person')
   *   .addIndex('person_first_name_index')
   *   .expression(sql<boolean>`(first_name < 'Sami')`)
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
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addIndex: AddIndexNode.cloneWithColumns(this.#props.node.addIndex!, [
          expression.toOperationNode(),
        ]),
      }),
    })
  }

  /**
   * Specifies the index type.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .alterTable('person')
   *   .addIndex('person_first_name_index')
   *   .column('first_name')
   *   .using('hash')
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add index `person_first_name_index` (`first_name`) using hash
   * ```
   */
  using(indexType: IndexType): AlterTableAddIndexBuilder
  using(indexType: string): AlterTableAddIndexBuilder
  using(indexType: string): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addIndex: AddIndexNode.cloneWith(this.#props.node.addIndex!, {
          using: RawNode.createWithSql(indexType),
        }),
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

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId,
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId,
    )
  }

  async execute(options?: AbortableOperationOptions): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), options)
  }
}

export interface AlterTableAddIndexBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTableNode
}

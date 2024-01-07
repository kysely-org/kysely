import {
  SelectQueryBuilder,
  createSelectQueryBuilder,
} from './query-builder/select-query-builder.js'
import { InsertQueryBuilder } from './query-builder/insert-query-builder.js'
import { DeleteQueryBuilder } from './query-builder/delete-query-builder.js'
import { UpdateQueryBuilder } from './query-builder/update-query-builder.js'
import { DeleteQueryNode } from './operation-node/delete-query-node.js'
import { InsertQueryNode } from './operation-node/insert-query-node.js'
import { SelectQueryNode } from './operation-node/select-query-node.js'
import { UpdateQueryNode } from './operation-node/update-query-node.js'
import {
  parseTable,
  parseTableExpression,
  parseTableExpressionOrList,
  TableExpression,
  From,
  TableExpressionOrList,
  FromTables,
  TableReference,
  TableReferenceOrList,
  ExtractTableAlias,
  AnyAliasedTable,
  PickTableWithAlias,
} from './parser/table-parser.js'
import { createQueryId } from './util/query-id.js'
import { freeze } from './util/object-utils.js'
import { InsertResult } from './query-builder/insert-result.js'
import { DeleteResult } from './query-builder/delete-result.js'
import { UpdateResult } from './query-builder/update-result.js'
import { KyselyPlugin } from './plugin/kysely-plugin.js'
import {
  CallbackSelection,
  SelectArg,
  SelectCallback,
  SelectExpression,
  Selection,
  parseSelectArg,
} from './parser/select-parser.js'
import { QueryCreatorProps } from './query-creator.js'
import { DatabaseWithOldNewTables } from './schema/create-trigger-builder.js'

export class TriggerQueryCreator<DB, TB extends keyof DB> {
  readonly #props: QueryCreatorProps

  constructor(props: QueryCreatorProps) {
    this.#props = freeze(props)
  }

  selectFrom<TE extends keyof DB & string>(
    from: TE[]
  ): SelectQueryBuilder<
    DatabaseWithOldNewTables<DB, TB>,
    ExtractTableAlias<DB, TE> | 'new' | 'old',
    {}
  >

  selectFrom<TE extends TableExpression<DB, keyof DB>>(
    from: TE[]
  ): SelectQueryBuilder<
    From<DatabaseWithOldNewTables<DB, TB>, TE>,
    FromTables<DB, never, TE> | 'new' | 'old',
    {}
  >

  selectFrom<TE extends keyof DB & string>(
    from: TE
  ): SelectQueryBuilder<
    DatabaseWithOldNewTables<DB, TB>,
    ExtractTableAlias<DB, TE> | 'new' | 'old',
    {}
  >

  selectFrom<TE extends AnyAliasedTable<DB>>(
    from: TE
  ): SelectQueryBuilder<
    DatabaseWithOldNewTables<DB, TB> &
      PickTableWithAlias<DatabaseWithOldNewTables<DB, TB>, TE>,
    ExtractTableAlias<DB, TE> | 'new' | 'old',
    {}
  >

  selectFrom<TE extends TableExpression<DB, keyof DB>>(
    from: TE
  ): SelectQueryBuilder<
    From<DatabaseWithOldNewTables<DB, TB>, TE>,
    FromTables<DB, never, TE> | 'new' | 'old',
    {}
  >

  selectFrom(from: TableExpressionOrList<any, any>): any {
    return createSelectQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: SelectQueryNode.createFrom(
        parseTableExpressionOrList(from),
        this.#props.withNode
      ),
    })
  }

  selectNoFrom<SE extends SelectExpression<DB, never>>(
    selections: ReadonlyArray<SE>
  ): SelectQueryBuilder<DB, never, Selection<DB, never, SE>>

  selectNoFrom<CB extends SelectCallback<DB, never>>(
    callback: CB
  ): SelectQueryBuilder<DB, never, CallbackSelection<DB, never, CB>>

  selectNoFrom<SE extends SelectExpression<DB, never>>(
    selection: SE
  ): SelectQueryBuilder<DB, never, Selection<DB, never, SE>>

  selectNoFrom<SE extends SelectExpression<DB, never>>(
    selection: SelectArg<DB, never, SE>
  ): SelectQueryBuilder<DB, never, Selection<DB, never, SE>> {
    return createSelectQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: SelectQueryNode.cloneWithSelections(
        SelectQueryNode.create(this.#props.withNode),
        parseSelectArg(selection as any)
      ),
    })
  }

  insertInto<T extends keyof DB & string>(
    table: T
  ): InsertQueryBuilder<DB, T, InsertResult> {
    return new InsertQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: InsertQueryNode.create(
        parseTable(table),
        this.#props.withNode
      ),
    })
  }

  replaceInto<T extends keyof DB & string>(
    table: T
  ): InsertQueryBuilder<DB, T, InsertResult> {
    return new InsertQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: InsertQueryNode.create(
        parseTable(table),
        this.#props.withNode,
        true
      ),
    })
  }

  deleteFrom<TR extends keyof DB & string>(
    from: TR[]
  ): DeleteQueryBuilder<
    DatabaseWithOldNewTables<DB, TB>,
    ExtractTableAlias<DB, TR> | 'new' | 'old',
    DeleteResult
  >

  deleteFrom<TR extends TableReference<DB>>(
    tables: TR[]
  ): DeleteQueryBuilder<
    From<DatabaseWithOldNewTables<DB, TB>, TR>,
    FromTables<DB, never, TR> | 'new' | 'old',
    DeleteResult
  >

  deleteFrom<TR extends keyof DB & string>(
    from: TR
  ): DeleteQueryBuilder<
    DatabaseWithOldNewTables<DB, TB>,
    ExtractTableAlias<DB, TR> | 'new' | 'old',
    DeleteResult
  >

  deleteFrom<TR extends TableReference<DB>>(
    table: TR
  ): DeleteQueryBuilder<
    From<DatabaseWithOldNewTables<DB, TB>, TR>,
    FromTables<DB, never, TR> | 'new' | 'old',
    DeleteResult
  >

  deleteFrom(tables: TableReferenceOrList<DB>): any {
    return new DeleteQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: DeleteQueryNode.create(
        parseTableExpressionOrList(tables),
        this.#props.withNode
      ),
    })
  }

  updateTable<TR extends keyof DB & string>(
    table: TR
  ): UpdateQueryBuilder<
    DB,
    ExtractTableAlias<DB, TR>,
    ExtractTableAlias<DB, TR>,
    UpdateResult
  >

  updateTable<TR extends AnyAliasedTable<DB>>(
    table: TR
  ): UpdateQueryBuilder<
    DB & PickTableWithAlias<DB, TR>,
    ExtractTableAlias<DB, TR>,
    ExtractTableAlias<DB, TR>,
    UpdateResult
  >

  updateTable<TR extends TableReference<DB>>(
    table: TR
  ): UpdateQueryBuilder<
    From<DB, TR>,
    FromTables<DB, never, TR>,
    FromTables<DB, never, TR>,
    UpdateResult
  >

  updateTable<TR extends TableReference<DB>>(table: TR): any {
    return new UpdateQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: UpdateQueryNode.create(
        parseTableExpression(table),
        this.#props.withNode
      ),
    })
  }

  withPlugin(plugin: KyselyPlugin): TriggerQueryCreator<DB, TB> {
    return new TriggerQueryCreator({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  withoutPlugins(): TriggerQueryCreator<DB, TB> {
    return new TriggerQueryCreator({
      ...this.#props,
      executor: this.#props.executor.withoutPlugins(),
    })
  }
}

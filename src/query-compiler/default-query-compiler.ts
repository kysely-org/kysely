import { AliasNode } from '../operation-node/alias-node.js'
import { AndNode } from '../operation-node/and-node.js'
import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { AddColumnNode } from '../operation-node/add-column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import { CreateIndexNode } from '../operation-node/create-index-node.js'
import { CreateTableNode } from '../operation-node/create-table-node.js'
import { DataTypeNode } from '../operation-node/data-type-node.js'
import { DeleteQueryNode } from '../operation-node/delete-query-node.js'
import { DropIndexNode } from '../operation-node/drop-index-node.js'
import { DropTableNode } from '../operation-node/drop-table-node.js'
import { FromNode } from '../operation-node/from-node.js'
import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import { GroupByNode } from '../operation-node/group-by-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import { JoinNode, JoinType } from '../operation-node/join-node.js'
import { LimitNode } from '../operation-node/limit-node.js'
import { ListNode } from '../operation-node/list-node.js'
import { OffsetNode } from '../operation-node/offset-node.js'
import { OnConflictNode } from '../operation-node/on-conflict-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { OperationNodeVisitor } from '../operation-node/operation-node-visitor.js'
import { OperatorNode } from '../operation-node/operator-node.js'
import { OrNode } from '../operation-node/or-node.js'
import { OrderByItemNode } from '../operation-node/order-by-item-node.js'
import { OrderByNode } from '../operation-node/order-by-node.js'
import { ParensNode } from '../operation-node/parens-node.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { ReferencesNode } from '../operation-node/references-node.js'
import { ReturningNode } from '../operation-node/returning-node.js'
import { SelectAllNode } from '../operation-node/select-all-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { SelectionNode } from '../operation-node/selection-node.js'
import { TableNode } from '../operation-node/table-node.js'
import { PrimaryKeyConstraintNode } from '../operation-node/primary-constraint-node.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'
import { UpdateQueryNode } from '../operation-node/update-query-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { WhereNode } from '../operation-node/where-node.js'
import { CommonTableExpressionNode } from '../operation-node/common-table-expression-node.js'
import { WithNode } from '../operation-node/with-node.js'
import {
  freeze,
  isString,
  isNumber,
  isBoolean,
  isNull,
  isDate,
  isBigInt,
} from '../util/object-utils.js'
import { CompiledQuery } from './compiled-query.js'
import { RootOperationNode, QueryCompiler } from './query-compiler.js'
import { HavingNode } from '../operation-node/having-node.js'
import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import {
  AlterTableColumnAlterationNode,
  AlterTableNode,
} from '../operation-node/alter-table-node.js'
import { DropColumnNode } from '../operation-node/drop-column-node.js'
import { RenameColumnNode } from '../operation-node/rename-column-node.js'
import { AlterColumnNode } from '../operation-node/alter-column-node.js'
import { AddConstraintNode } from '../operation-node/add-constraint-node.js'
import { DropConstraintNode } from '../operation-node/drop-constraint-node.js'
import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import { ModifyColumnNode } from '../operation-node/modify-column-node.js'
import { OnDuplicateKeyNode } from '../operation-node/on-duplicate-key-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { CreateViewNode } from '../operation-node/create-view-node.js'
import { DropViewNode } from '../operation-node/drop-view-node.js'
import { GeneratedNode } from '../operation-node/generated-node.js'
import { DefaultValueNode } from '../operation-node/default-value-node.js'
import { OnNode } from '../operation-node/on-node.js'
import { ValuesNode } from '../operation-node/values-node.js'
import { CommonTableExpressionNameNode } from '../operation-node/common-table-expression-name-node.js'
import {
  SelectModifier,
  SelectModifierNode,
} from '../operation-node/select-modifier-node.js'
import { CreateTypeNode } from '../operation-node/create-type-node.js'
import { DropTypeNode } from '../operation-node/drop-type-node.js'
import { ExplainNode } from '../operation-node/explain-node.js'
import { SchemableIdentifierNode } from '../operation-node/schemable-identifier-node.js'
import { DefaultInsertValueNode } from '../operation-node/default-insert-value-node.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import { OverNode } from '../operation-node/over-node.js'
import { PartitionByNode } from '../operation-node/partition-by-node.js'
import { PartitionByItemNode } from '../operation-node/partition-by-item-node.js'
import { SetOperationNode } from '../operation-node/set-operation-node.js'
import { BinaryOperationNode } from '../operation-node/binary-operation-node.js'
import { UnaryOperationNode } from '../operation-node/unary-operation-node.js'
import { UsingNode } from '../operation-node/using-node.js'
import { FunctionNode } from '../operation-node/function-node.js'
import { CaseNode } from '../operation-node/case-node.js'
import { WhenNode } from '../operation-node/when-node.js'
import { JSONReferenceNode } from '../operation-node/json-reference-node.js'
import { JSONPathNode } from '../operation-node/json-path-node.js'
import { JSONPathLegNode } from '../operation-node/json-path-leg-node.js'
import { JSONOperatorChainNode } from '../operation-node/json-operator-chain-node.js'
import { TupleNode } from '../operation-node/tuple-node.js'
import { MergeQueryNode } from '../operation-node/merge-query-node.js'
import { MatchedNode } from '../operation-node/matched-node.js'
import { AddIndexNode } from '../operation-node/add-index-node.js'
import { CastNode } from '../operation-node/cast-node.js'
import { FetchNode } from '../operation-node/fetch-node.js'
import { TopNode } from '../operation-node/top-node.js'
import { OutputNode } from '../operation-node/output-node.js'
import { RefreshMaterializedViewNode } from '../operation-node/refresh-materialized-view-node.js'

export class DefaultQueryCompiler
  extends OperationNodeVisitor
  implements QueryCompiler
{
  #sql = ''
  #parameters: unknown[] = []

  protected get numParameters(): number {
    return this.#parameters.length
  }

  compileQuery(node: RootOperationNode): CompiledQuery {
    this.#sql = ''
    this.#parameters = []
    this.nodeStack.splice(0, this.nodeStack.length)

    this.visitNode(node)

    return freeze({
      query: node,
      sql: this.getSql(),
      parameters: [...this.#parameters],
    })
  }

  protected getSql(): string {
    return this.#sql
  }

  protected override visitSelectQuery(node: SelectQueryNode): void {
    const wrapInParens =
      this.parentNode !== undefined &&
      !ParensNode.is(this.parentNode) &&
      !InsertQueryNode.is(this.parentNode) &&
      !CreateTableNode.is(this.parentNode) &&
      !CreateViewNode.is(this.parentNode) &&
      !SetOperationNode.is(this.parentNode)

    if (this.parentNode === undefined && node.explain) {
      this.visitNode(node.explain)
      this.append(' ')
    }

    if (wrapInParens) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('select')

    if (node.distinctOn) {
      this.append(' ')
      this.compileDistinctOn(node.distinctOn)
    }

    if (node.frontModifiers?.length) {
      this.append(' ')
      this.compileList(node.frontModifiers, ' ')
    }

    if (node.top) {
      this.append(' ')
      this.visitNode(node.top)
    }

    if (node.selections) {
      this.append(' ')
      this.compileList(node.selections)
    }

    if (node.from) {
      this.append(' ')
      this.visitNode(node.from)
    }

    if (node.joins) {
      this.append(' ')
      this.compileList(node.joins, ' ')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.groupBy) {
      this.append(' ')
      this.visitNode(node.groupBy)
    }

    if (node.having) {
      this.append(' ')
      this.visitNode(node.having)
    }

    if (node.setOperations) {
      this.append(' ')
      this.compileList(node.setOperations, ' ')
    }

    if (node.orderBy) {
      this.append(' ')
      this.visitNode(node.orderBy)
    }

    if (node.limit) {
      this.append(' ')
      this.visitNode(node.limit)
    }

    if (node.offset) {
      this.append(' ')
      this.visitNode(node.offset)
    }

    if (node.fetch) {
      this.append(' ')
      this.visitNode(node.fetch)
    }

    if (node.endModifiers?.length) {
      this.append(' ')
      this.compileList(this.sortSelectModifiers([...node.endModifiers]), ' ')
    }

    if (wrapInParens) {
      this.append(')')
    }
  }

  protected override visitFrom(node: FromNode): void {
    this.append('from ')
    this.compileList(node.froms)
  }

  protected override visitSelection(node: SelectionNode): void {
    this.visitNode(node.selection)
  }

  protected override visitColumn(node: ColumnNode): void {
    this.visitNode(node.column)
  }

  protected compileDistinctOn(expressions: ReadonlyArray<OperationNode>): void {
    this.append('distinct on (')
    this.compileList(expressions)
    this.append(')')
  }

  protected compileList(
    nodes: ReadonlyArray<OperationNode>,
    separator = ', ',
  ): void {
    const lastIndex = nodes.length - 1

    for (let i = 0; i <= lastIndex; i++) {
      this.visitNode(nodes[i])

      if (i < lastIndex) {
        this.append(separator)
      }
    }
  }

  protected override visitWhere(node: WhereNode): void {
    this.append('where ')
    this.visitNode(node.where)
  }

  protected override visitHaving(node: HavingNode): void {
    this.append('having ')
    this.visitNode(node.having)
  }

  protected override visitInsertQuery(node: InsertQueryNode): void {
    const rootQueryNode = this.nodeStack.find(QueryNode.is)!
    const isSubQuery = rootQueryNode !== node

    if (!isSubQuery && node.explain) {
      this.visitNode(node.explain)
      this.append(' ')
    }

    if (isSubQuery && !MergeQueryNode.is(rootQueryNode)) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append(node.replace ? 'replace' : 'insert')

    if (node.ignore) {
      this.append(' ignore')
    }

    if (node.top) {
      this.append(' ')
      this.visitNode(node.top)
    }

    if (node.into) {
      this.append(' into ')
      this.visitNode(node.into)
    }

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    }

    if (node.output) {
      this.append(' ')
      this.visitNode(node.output)
    }

    if (node.values) {
      this.append(' ')
      this.visitNode(node.values)
    }

    if (node.defaultValues) {
      this.append(' ')
      this.append('default values')
    }

    if (node.onConflict) {
      this.append(' ')
      this.visitNode(node.onConflict)
    }

    if (node.onDuplicateKey) {
      this.append(' ')
      this.visitNode(node.onDuplicateKey)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (isSubQuery && !MergeQueryNode.is(rootQueryNode)) {
      this.append(')')
    }

    if (node.endModifiers?.length) {
      this.append(' ')
      this.compileList(node.endModifiers, ' ')
    }
  }

  protected override visitValues(node: ValuesNode): void {
    this.append('values ')
    this.compileList(node.values)
  }

  protected override visitDeleteQuery(node: DeleteQueryNode): void {
    const isSubQuery = this.nodeStack.find(QueryNode.is) !== node

    if (!isSubQuery && node.explain) {
      this.visitNode(node.explain)
      this.append(' ')
    }

    if (isSubQuery) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('delete ')

    if (node.top) {
      this.visitNode(node.top)
      this.append(' ')
    }

    this.visitNode(node.from)

    if (node.output) {
      this.append(' ')
      this.visitNode(node.output)
    }

    if (node.using) {
      this.append(' ')
      this.visitNode(node.using)
    }

    if (node.joins) {
      this.append(' ')
      this.compileList(node.joins, ' ')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.orderBy) {
      this.append(' ')
      this.visitNode(node.orderBy)
    }

    if (node.limit) {
      this.append(' ')
      this.visitNode(node.limit)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (isSubQuery) {
      this.append(')')
    }

    if (node.endModifiers?.length) {
      this.append(' ')
      this.compileList(node.endModifiers, ' ')
    }
  }

  protected override visitReturning(node: ReturningNode): void {
    this.append('returning ')
    this.compileList(node.selections)
  }

  protected override visitAlias(node: AliasNode): void {
    this.visitNode(node.node)
    this.append(' as ')
    this.visitNode(node.alias)
  }

  protected override visitReference(node: ReferenceNode): void {
    if (node.table) {
      this.visitNode(node.table)
      this.append('.')
    }

    this.visitNode(node.column)
  }

  protected override visitSelectAll(_: SelectAllNode): void {
    this.append('*')
  }

  protected override visitIdentifier(node: IdentifierNode): void {
    this.append(this.getLeftIdentifierWrapper())
    this.compileUnwrappedIdentifier(node)
    this.append(this.getRightIdentifierWrapper())
  }

  protected compileUnwrappedIdentifier(node: IdentifierNode): void {
    if (!isString(node.name)) {
      throw new Error(
        'a non-string identifier was passed to compileUnwrappedIdentifier.',
      )
    }

    this.append(this.sanitizeIdentifier(node.name))
  }

  protected override visitAnd(node: AndNode): void {
    this.visitNode(node.left)
    this.append(' and ')
    this.visitNode(node.right)
  }

  protected override visitOr(node: OrNode): void {
    this.visitNode(node.left)
    this.append(' or ')
    this.visitNode(node.right)
  }

  protected override visitValue(node: ValueNode): void {
    if (node.immediate) {
      this.appendImmediateValue(node.value)
    } else {
      this.appendValue(node.value)
    }
  }

  protected override visitValueList(node: ValueListNode): void {
    this.append('(')
    this.compileList(node.values)
    this.append(')')
  }

  protected override visitTuple(node: TupleNode): void {
    this.append('(')
    this.compileList(node.values)
    this.append(')')
  }

  protected override visitPrimitiveValueList(
    node: PrimitiveValueListNode,
  ): void {
    this.append('(')

    const { values } = node
    for (let i = 0; i < values.length; ++i) {
      this.appendValue(values[i])

      if (i !== values.length - 1) {
        this.append(', ')
      }
    }

    this.append(')')
  }

  protected override visitParens(node: ParensNode): void {
    this.append('(')
    this.visitNode(node.node)
    this.append(')')
  }

  protected override visitJoin(node: JoinNode): void {
    this.append(JOIN_TYPE_SQL[node.joinType])
    this.append(' ')
    this.visitNode(node.table)

    if (node.on) {
      this.append(' ')
      this.visitNode(node.on)
    }
  }

  protected override visitOn(node: OnNode): void {
    this.append('on ')
    this.visitNode(node.on)
  }

  protected override visitRaw(node: RawNode): void {
    const { sqlFragments, parameters: params } = node

    for (let i = 0; i < sqlFragments.length; ++i) {
      this.append(sqlFragments[i])

      if (params.length > i) {
        this.visitNode(params[i])
      }
    }
  }

  protected override visitOperator(node: OperatorNode): void {
    this.append(node.operator)
  }

  protected override visitTable(node: TableNode): void {
    this.visitNode(node.table)
  }

  protected override visitSchemableIdentifier(
    node: SchemableIdentifierNode,
  ): void {
    if (node.schema) {
      this.visitNode(node.schema)
      this.append('.')
    }

    this.visitNode(node.identifier)
  }

  protected override visitCreateTable(node: CreateTableNode): void {
    this.append('create ')

    if (node.frontModifiers && node.frontModifiers.length > 0) {
      this.compileList(node.frontModifiers, ' ')
      this.append(' ')
    }

    if (node.temporary) {
      this.append('temporary ')
    }

    this.append('table ')

    if (node.ifNotExists) {
      this.append('if not exists ')
    }

    this.visitNode(node.table)

    if (node.selectQuery) {
      this.append(' as ')
      this.visitNode(node.selectQuery)
    } else {
      this.append(' (')
      this.compileList([...node.columns, ...(node.constraints ?? [])])
      this.append(')')

      if (node.onCommit) {
        this.append(' on commit ')
        this.append(node.onCommit)
      }

      if (node.endModifiers && node.endModifiers.length > 0) {
        this.append(' ')
        this.compileList(node.endModifiers, ' ')
      }
    }
  }

  protected override visitColumnDefinition(node: ColumnDefinitionNode): void {
    if (node.ifNotExists) {
      this.append('if not exists ')
    }

    this.visitNode(node.column)

    this.append(' ')
    this.visitNode(node.dataType)

    if (node.unsigned) {
      this.append(' unsigned')
    }

    if (node.frontModifiers && node.frontModifiers.length > 0) {
      this.append(' ')
      this.compileList(node.frontModifiers, ' ')
    }

    if (node.generated) {
      this.append(' ')
      this.visitNode(node.generated)
    }

    if (node.identity) {
      this.append(' identity')
    }

    if (node.defaultTo) {
      this.append(' ')
      this.visitNode(node.defaultTo)
    }

    if (node.notNull) {
      this.append(' not null')
    }

    if (node.unique) {
      this.append(' unique')
    }

    if (node.nullsNotDistinct) {
      this.append(' nulls not distinct')
    }

    if (node.primaryKey) {
      this.append(' primary key')
    }

    if (node.autoIncrement) {
      this.append(' ')
      this.append(this.getAutoIncrement())
    }

    if (node.references) {
      this.append(' ')
      this.visitNode(node.references)
    }

    if (node.check) {
      this.append(' ')
      this.visitNode(node.check)
    }

    if (node.endModifiers && node.endModifiers.length > 0) {
      this.append(' ')
      this.compileList(node.endModifiers, ' ')
    }
  }

  protected getAutoIncrement() {
    return 'auto_increment'
  }

  protected override visitReferences(node: ReferencesNode): void {
    this.append('references ')
    this.visitNode(node.table)
    this.append(' (')
    this.compileList(node.columns)
    this.append(')')

    if (node.onDelete) {
      this.append(' on delete ')
      this.append(node.onDelete)
    }

    if (node.onUpdate) {
      this.append(' on update ')
      this.append(node.onUpdate)
    }
  }

  protected override visitDropTable(node: DropTableNode): void {
    this.append('drop table ')

    if (node.ifExists) {
      this.append('if exists ')
    }

    this.visitNode(node.table)

    if (node.cascade) {
      this.append(' cascade')
    }
  }

  protected override visitDataType(node: DataTypeNode): void {
    this.append(node.dataType)
  }

  protected override visitOrderBy(node: OrderByNode): void {
    this.append('order by ')
    this.compileList(node.items)
  }

  protected override visitOrderByItem(node: OrderByItemNode): void {
    this.visitNode(node.orderBy)

    if (node.direction) {
      this.append(' ')
      this.visitNode(node.direction)
    }
  }

  protected override visitGroupBy(node: GroupByNode): void {
    this.append('group by ')
    this.compileList(node.items)
  }

  protected override visitGroupByItem(node: GroupByItemNode): void {
    this.visitNode(node.groupBy)
  }

  protected override visitUpdateQuery(node: UpdateQueryNode): void {
    const rootQueryNode = this.nodeStack.find(QueryNode.is)!
    const isSubQuery = rootQueryNode !== node

    if (!isSubQuery && node.explain) {
      this.visitNode(node.explain)
      this.append(' ')
    }

    if (isSubQuery && !MergeQueryNode.is(rootQueryNode)) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('update ')

    if (node.top) {
      this.visitNode(node.top)
      this.append(' ')
    }

    if (node.table) {
      this.visitNode(node.table)
      this.append(' ')
    }

    this.append('set ')

    if (node.updates) {
      this.compileList(node.updates)
    }

    if (node.output) {
      this.append(' ')
      this.visitNode(node.output)
    }

    if (node.from) {
      this.append(' ')
      this.visitNode(node.from)
    }

    if (node.joins) {
      if (!node.from) {
        throw new Error("Joins in an update query are only supported as a part of a PostgreSQL 'update set from join' query. If you want to create a MySQL 'update join set' query, see https://kysely.dev/docs/examples/update/my-sql-joins")
      }

      this.append(' ')
      this.compileList(node.joins, ' ')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.limit) {
      this.append(' ')
      this.visitNode(node.limit)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (isSubQuery && !MergeQueryNode.is(rootQueryNode)) {
      this.append(')')
    }

    if (node.endModifiers?.length) {
      this.append(' ')
      this.compileList(node.endModifiers, ' ')
    }
  }

  protected override visitColumnUpdate(node: ColumnUpdateNode): void {
    this.visitNode(node.column)
    this.append(' = ')
    this.visitNode(node.value)
  }

  protected override visitLimit(node: LimitNode): void {
    this.append('limit ')
    this.visitNode(node.limit)
  }

  protected override visitOffset(node: OffsetNode): void {
    this.append('offset ')
    this.visitNode(node.offset)
  }

  protected override visitOnConflict(node: OnConflictNode): void {
    this.append('on conflict')

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    } else if (node.constraint) {
      this.append(' on constraint ')
      this.visitNode(node.constraint)
    } else if (node.indexExpression) {
      this.append(' (')
      this.visitNode(node.indexExpression)
      this.append(')')
    }

    if (node.indexWhere) {
      this.append(' ')
      this.visitNode(node.indexWhere)
    }

    if (node.doNothing === true) {
      this.append(' do nothing')
    } else if (node.updates) {
      this.append(' do update set ')
      this.compileList(node.updates)

      if (node.updateWhere) {
        this.append(' ')
        this.visitNode(node.updateWhere)
      }
    }
  }

  protected override visitOnDuplicateKey(node: OnDuplicateKeyNode): void {
    this.append('on duplicate key update ')
    this.compileList(node.updates)
  }

  protected override visitCreateIndex(node: CreateIndexNode): void {
    this.append('create ')

    if (node.unique) {
      this.append('unique ')
    }

    this.append('index ')

    if (node.ifNotExists) {
      this.append('if not exists ')
    }

    this.visitNode(node.name)

    if (node.table) {
      this.append(' on ')
      this.visitNode(node.table)
    }

    if (node.using) {
      this.append(' using ')
      this.visitNode(node.using)
    }

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    }

    if (node.nullsNotDistinct) {
      this.append(' nulls not distinct')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }
  }

  protected override visitDropIndex(node: DropIndexNode): void {
    this.append('drop index ')

    if (node.ifExists) {
      this.append('if exists ')
    }

    this.visitNode(node.name)

    if (node.table) {
      this.append(' on ')
      this.visitNode(node.table)
    }

    if (node.cascade) {
      this.append(' cascade')
    }
  }

  protected override visitCreateSchema(node: CreateSchemaNode): void {
    this.append('create schema ')

    if (node.ifNotExists) {
      this.append('if not exists ')
    }

    this.visitNode(node.schema)
  }

  protected override visitDropSchema(node: DropSchemaNode): void {
    this.append('drop schema ')

    if (node.ifExists) {
      this.append('if exists ')
    }

    this.visitNode(node.schema)

    if (node.cascade) {
      this.append(' cascade')
    }
  }

  protected override visitPrimaryKeyConstraint(
    node: PrimaryKeyConstraintNode,
  ): void {
    if (node.name) {
      this.append('constraint ')
      this.visitNode(node.name)
      this.append(' ')
    }

    this.append('primary key (')
    this.compileList(node.columns)
    this.append(')')
  }

  protected override visitUniqueConstraint(node: UniqueConstraintNode): void {
    if (node.name) {
      this.append('constraint ')
      this.visitNode(node.name)
      this.append(' ')
    }

    this.append('unique')

    if (node.nullsNotDistinct) {
      this.append(' nulls not distinct')
    }

    this.append(' (')
    this.compileList(node.columns)
    this.append(')')
  }

  protected override visitCheckConstraint(node: CheckConstraintNode): void {
    if (node.name) {
      this.append('constraint ')
      this.visitNode(node.name)
      this.append(' ')
    }

    this.append('check (')
    this.visitNode(node.expression)
    this.append(')')
  }

  protected override visitForeignKeyConstraint(
    node: ForeignKeyConstraintNode,
  ): void {
    if (node.name) {
      this.append('constraint ')
      this.visitNode(node.name)
      this.append(' ')
    }

    this.append('foreign key (')
    this.compileList(node.columns)
    this.append(') ')
    this.visitNode(node.references)

    if (node.onDelete) {
      this.append(' on delete ')
      this.append(node.onDelete)
    }

    if (node.onUpdate) {
      this.append(' on update ')
      this.append(node.onUpdate)
    }
  }

  protected override visitList(node: ListNode): void {
    this.compileList(node.items)
  }

  protected override visitWith(node: WithNode): void {
    this.append('with ')

    if (node.recursive) {
      this.append('recursive ')
    }

    this.compileList(node.expressions)
  }

  protected override visitCommonTableExpression(
    node: CommonTableExpressionNode,
  ): void {
    this.visitNode(node.name)
    this.append(' as ')

    if (isBoolean(node.materialized)) {
      if (!node.materialized) {
        this.append('not ')
      }

      this.append('materialized ')
    }

    this.visitNode(node.expression)
  }

  protected override visitCommonTableExpressionName(
    node: CommonTableExpressionNameNode,
  ): void {
    this.visitNode(node.table)

    if (node.columns) {
      this.append('(')
      this.compileList(node.columns)
      this.append(')')
    }
  }

  protected override visitAlterTable(node: AlterTableNode): void {
    this.append('alter table ')
    this.visitNode(node.table)
    this.append(' ')

    if (node.renameTo) {
      this.append('rename to ')
      this.visitNode(node.renameTo)
    }

    if (node.setSchema) {
      this.append('set schema ')
      this.visitNode(node.setSchema)
    }

    if (node.addConstraint) {
      this.visitNode(node.addConstraint)
    }

    if (node.dropConstraint) {
      this.visitNode(node.dropConstraint)
    }

    if (node.columnAlterations) {
      this.compileColumnAlterations(node.columnAlterations)
    }

    if (node.addIndex) {
      this.visitNode(node.addIndex)
    }

    if (node.dropIndex) {
      this.visitNode(node.dropIndex)
    }
  }

  protected override visitAddColumn(node: AddColumnNode): void {
    this.append('add column ')
    this.visitNode(node.column)
  }

  protected override visitRenameColumn(node: RenameColumnNode): void {
    this.append('rename column ')
    this.visitNode(node.column)
    this.append(' to ')
    this.visitNode(node.renameTo)
  }

  protected override visitDropColumn(node: DropColumnNode): void {
    this.append('drop column ')
    this.visitNode(node.column)
  }

  protected override visitAlterColumn(node: AlterColumnNode): void {
    this.append('alter column ')
    this.visitNode(node.column)
    this.append(' ')

    if (node.dataType) {
      if (this.announcesNewColumnDataType()) {
        this.append('type ')
      }

      this.visitNode(node.dataType)

      if (node.dataTypeExpression) {
        this.append('using ')
        this.visitNode(node.dataTypeExpression)
      }
    }

    if (node.setDefault) {
      this.append('set default ')
      this.visitNode(node.setDefault)
    }

    if (node.dropDefault) {
      this.append('drop default')
    }

    if (node.setNotNull) {
      this.append('set not null')
    }

    if (node.dropNotNull) {
      this.append('drop not null')
    }
  }

  protected override visitModifyColumn(node: ModifyColumnNode): void {
    this.append('modify column ')
    this.visitNode(node.column)
  }

  protected override visitAddConstraint(node: AddConstraintNode): void {
    this.append('add ')
    this.visitNode(node.constraint)
  }

  protected override visitDropConstraint(node: DropConstraintNode): void {
    this.append('drop constraint ')

    if (node.ifExists) {
      this.append('if exists ')
    }

    this.visitNode(node.constraintName)

    if (node.modifier === 'cascade') {
      this.append(' cascade')
    } else if (node.modifier === 'restrict') {
      this.append(' restrict')
    }
  }

  protected override visitSetOperation(node: SetOperationNode): void {
    this.append(node.operator)
    this.append(' ')

    if (node.all) {
      this.append('all ')
    }

    this.visitNode(node.expression)
  }

  protected override visitCreateView(node: CreateViewNode): void {
    this.append('create ')

    if (node.orReplace) {
      this.append('or replace ')
    }

    if (node.materialized) {
      this.append('materialized ')
    }

    if (node.temporary) {
      this.append('temporary ')
    }

    this.append('view ')

    if (node.ifNotExists) {
      this.append('if not exists ')
    }

    this.visitNode(node.name)
    this.append(' ')

    if (node.columns) {
      this.append('(')
      this.compileList(node.columns)
      this.append(') ')
    }

    if (node.as) {
      this.append('as ')
      this.visitNode(node.as)
    }
  }
  
  protected override visitRefreshMaterializedView(node: RefreshMaterializedViewNode): void {
    this.append('refresh materialized view ')

    if (node.concurrently) {
      this.append('concurrently ')
    }

    this.visitNode(node.name)

    if (node.withNoData) {
      this.append(' with no data')
    } else {
      this.append(' with data')
    }
  }

  protected override visitDropView(node: DropViewNode): void {
    this.append('drop ')

    if (node.materialized) {
      this.append('materialized ')
    }

    this.append('view ')

    if (node.ifExists) {
      this.append('if exists ')
    }

    this.visitNode(node.name)

    if (node.cascade) {
      this.append(' cascade')
    }
  }

  protected override visitGenerated(node: GeneratedNode): void {
    this.append('generated ')

    if (node.always) {
      this.append('always ')
    }

    if (node.byDefault) {
      this.append('by default ')
    }

    this.append('as ')

    if (node.identity) {
      this.append('identity')
    }

    if (node.expression) {
      this.append('(')
      this.visitNode(node.expression)
      this.append(')')
    }

    if (node.stored) {
      this.append(' stored')
    }
  }

  protected override visitDefaultValue(node: DefaultValueNode): void {
    this.append('default ')
    this.visitNode(node.defaultValue)
  }

  protected override visitSelectModifier(node: SelectModifierNode): void {
    if (node.rawModifier) {
      this.visitNode(node.rawModifier)
    } else {
      this.append(SELECT_MODIFIER_SQL[node.modifier!])
    }

    if (node.of) {
      this.append(' of ')
      this.compileList(node.of, ', ')
    }
  }

  protected override visitCreateType(node: CreateTypeNode): void {
    this.append('create type ')
    this.visitNode(node.name)

    if (node.enum) {
      this.append(' as enum ')
      this.visitNode(node.enum)
    }
  }

  protected override visitDropType(node: DropTypeNode): void {
    this.append('drop type ')

    if (node.ifExists) {
      this.append('if exists ')
    }

    this.visitNode(node.name)
  }

  protected override visitExplain(node: ExplainNode): void {
    this.append('explain')

    if (node.options || node.format) {
      this.append(' ')
      this.append(this.getLeftExplainOptionsWrapper())

      if (node.options) {
        this.visitNode(node.options)

        if (node.format) {
          this.append(this.getExplainOptionsDelimiter())
        }
      }

      if (node.format) {
        this.append('format')
        this.append(this.getExplainOptionAssignment())
        this.append(node.format)
      }

      this.append(this.getRightExplainOptionsWrapper())
    }
  }

  protected visitDefaultInsertValue(_: DefaultInsertValueNode): void {
    this.append('default')
  }

  protected override visitAggregateFunction(node: AggregateFunctionNode): void {
    this.append(node.func)
    this.append('(')

    if (node.distinct) {
      this.append('distinct ')
    }

    this.compileList(node.aggregated)
    this.append(')')

    if (node.filter) {
      this.append(' filter(')
      this.visitNode(node.filter)
      this.append(')')
    }

    if (node.over) {
      this.append(' ')
      this.visitNode(node.over)
    }
  }

  protected override visitOver(node: OverNode): void {
    this.append('over(')

    if (node.partitionBy) {
      this.visitNode(node.partitionBy)

      if (node.orderBy) {
        this.append(' ')
      }
    }

    if (node.orderBy) {
      this.visitNode(node.orderBy)
    }

    this.append(')')
  }

  protected override visitPartitionBy(node: PartitionByNode): void {
    this.append('partition by ')
    this.compileList(node.items)
  }

  protected override visitPartitionByItem(node: PartitionByItemNode): void {
    this.visitNode(node.partitionBy)
  }

  protected override visitBinaryOperation(node: BinaryOperationNode): void {
    this.visitNode(node.leftOperand)
    this.append(' ')
    this.visitNode(node.operator)
    this.append(' ')
    this.visitNode(node.rightOperand)
  }

  protected override visitUnaryOperation(node: UnaryOperationNode): void {
    this.visitNode(node.operator)

    if (!this.isMinusOperator(node.operator)) {
      this.append(' ')
    }

    this.visitNode(node.operand)
  }

  protected isMinusOperator(node: OperationNode): node is OperatorNode {
    return OperatorNode.is(node) && node.operator === '-'
  }

  protected override visitUsing(node: UsingNode): void {
    this.append('using ')
    this.compileList(node.tables)
  }

  protected override visitFunction(node: FunctionNode): void {
    this.append(node.func)
    this.append('(')
    this.compileList(node.arguments)
    this.append(')')
  }

  protected override visitCase(node: CaseNode): void {
    this.append('case')

    if (node.value) {
      this.append(' ')
      this.visitNode(node.value)
    }

    if (node.when) {
      this.append(' ')
      this.compileList(node.when, ' ')
    }

    if (node.else) {
      this.append(' else ')
      this.visitNode(node.else)
    }

    this.append(' end')

    if (node.isStatement) {
      this.append(' case')
    }
  }

  protected override visitWhen(node: WhenNode): void {
    this.append('when ')

    this.visitNode(node.condition)

    if (node.result) {
      this.append(' then ')
      this.visitNode(node.result)
    }
  }

  protected override visitJSONReference(node: JSONReferenceNode): void {
    this.visitNode(node.reference)
    this.visitNode(node.traversal)
  }

  protected override visitJSONPath(node: JSONPathNode): void {
    if (node.inOperator) {
      this.visitNode(node.inOperator)
    }

    this.append("'$")

    for (const pathLeg of node.pathLegs) {
      this.visitNode(pathLeg)
    }

    this.append("'")
  }

  protected override visitJSONPathLeg(node: JSONPathLegNode): void {
    const isArrayLocation = node.type === 'ArrayLocation'

    this.append(isArrayLocation ? '[' : '.')

    this.append(String(node.value))

    if (isArrayLocation) {
      this.append(']')
    }
  }

  protected override visitJSONOperatorChain(node: JSONOperatorChainNode): void {
    for (let i = 0, len = node.values.length; i < len; i++) {
      if (i === len - 1) {
        this.visitNode(node.operator)
      } else {
        this.append('->')
      }

      this.visitNode(node.values[i])
    }
  }

  protected override visitMergeQuery(node: MergeQueryNode): void {
    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('merge ')

    if (node.top) {
      this.visitNode(node.top)
      this.append(' ')
    }

    this.append('into ')
    this.visitNode(node.into)

    if (node.using) {
      this.append(' ')
      this.visitNode(node.using)
    }

    if (node.whens) {
      this.append(' ')
      this.compileList(node.whens, ' ')
    }

    if (node.output) {
      this.append(' ')
      this.visitNode(node.output)
    }

    if (node.endModifiers?.length) {
      this.append(' ')
      this.compileList(node.endModifiers, ' ')
    }
  }

  protected override visitMatched(node: MatchedNode): void {
    if (node.not) {
      this.append('not ')
    }

    this.append('matched')

    if (node.bySource) {
      this.append(' by source')
    }
  }

  protected override visitAddIndex(node: AddIndexNode): void {
    this.append('add ')

    if (node.unique) {
      this.append('unique ')
    }

    this.append('index ')

    this.visitNode(node.name)

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    }

    if (node.using) {
      this.append(' using ')
      this.visitNode(node.using)
    }
  }

  protected override visitCast(node: CastNode): void {
    this.append('cast(')
    this.visitNode(node.expression)
    this.append(' as ')
    this.visitNode(node.dataType)
    this.append(')')
  }

  protected override visitFetch(node: FetchNode): void {
    this.append('fetch next ')
    this.visitNode(node.rowCount)
    this.append(` rows ${node.modifier}`)
  }

  protected override visitOutput(node: OutputNode): void {
    this.append('output ')
    this.compileList(node.selections)
  }

  protected override visitTop(node: TopNode): void {
    this.append(`top(${node.expression})`)

    if (node.modifiers) {
      this.append(` ${node.modifiers}`)
    }
  }

  protected append(str: string): void {
    this.#sql += str
  }

  protected appendValue(parameter: unknown): void {
    this.addParameter(parameter)
    this.append(this.getCurrentParameterPlaceholder())
  }

  protected getLeftIdentifierWrapper(): string {
    return '"'
  }

  protected getRightIdentifierWrapper(): string {
    return '"'
  }

  protected getCurrentParameterPlaceholder(): string {
    return '$' + this.numParameters
  }

  protected getLeftExplainOptionsWrapper(): string {
    return '('
  }

  protected getExplainOptionAssignment(): string {
    return ' '
  }

  protected getExplainOptionsDelimiter(): string {
    return ', '
  }

  protected getRightExplainOptionsWrapper(): string {
    return ')'
  }

  protected sanitizeIdentifier(identifier: string): string {
    const leftWrap = this.getLeftIdentifierWrapper()
    const rightWrap = this.getRightIdentifierWrapper()

    let sanitized = ''
    for (const c of identifier) {
      sanitized += c

      if (c === leftWrap) {
        sanitized += leftWrap
      } else if (c === rightWrap) {
        sanitized += rightWrap
      }
    }

    return sanitized
  }

  protected addParameter(parameter: unknown): void {
    this.#parameters.push(parameter)
  }

  protected appendImmediateValue(value: unknown): void {
    if (isString(value)) {
      this.append(`'${value}'`)
    } else if (isNumber(value) || isBoolean(value)) {
      this.append(value.toString())
    } else if (isNull(value)) {
      this.append('null')
    } else if (isDate(value)) {
      this.appendImmediateValue(value.toISOString())
    } else if (isBigInt(value)) {
      this.appendImmediateValue(value.toString())
    } else {
      throw new Error(`invalid immediate value ${value}`)
    }
  }

  protected sortSelectModifiers(
    arr: SelectModifierNode[],
  ): ReadonlyArray<SelectModifierNode> {
    arr.sort((left, right) =>
      left.modifier && right.modifier
        ? SELECT_MODIFIER_PRIORITY[left.modifier] -
          SELECT_MODIFIER_PRIORITY[right.modifier]
        : 1,
    )

    return freeze(arr)
  }

  protected compileColumnAlterations(
    columnAlterations: readonly AlterTableColumnAlterationNode[],
  ) {
    this.compileList(columnAlterations)
  }

  /**
   * controls whether the dialect adds a "type" keyword before a column's new data
   * type in an ALTER TABLE statement.
   */
  protected announcesNewColumnDataType(): boolean {
    return true
  }
}

const SELECT_MODIFIER_SQL: Readonly<Record<SelectModifier, string>> = freeze({
  ForKeyShare: 'for key share',
  ForNoKeyUpdate: 'for no key update',
  ForUpdate: 'for update',
  ForShare: 'for share',
  NoWait: 'nowait',
  SkipLocked: 'skip locked',
  Distinct: 'distinct',
})

const SELECT_MODIFIER_PRIORITY: Readonly<Record<SelectModifier, number>> =
  freeze({
    ForKeyShare: 1,
    ForNoKeyUpdate: 1,
    ForUpdate: 1,
    ForShare: 1,
    NoWait: 2,
    SkipLocked: 2,
    Distinct: 0,
  })

const JOIN_TYPE_SQL: Readonly<Record<JoinType, string>> = freeze({
  InnerJoin: 'inner join',
  LeftJoin: 'left join',
  RightJoin: 'right join',
  FullJoin: 'full join',
  LateralInnerJoin: 'inner join lateral',
  LateralLeftJoin: 'left join lateral',
  Using: 'using',
})

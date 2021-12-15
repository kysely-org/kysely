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
import { FilterNode } from '../operation-node/filter-node.js'
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
import {
  SelectModifier,
  SelectQueryNode,
} from '../operation-node/select-query-node.js'
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
  getLast,
  freeze,
  isString,
  isNumber,
  isBoolean,
  isNull,
  PrimitiveValue,
  isDate,
  isBigInt,
} from '../util/object-utils.js'
import { CompiledQuery } from './compiled-query.js'
import { RootOperationNode, QueryCompiler } from './query-compiler.js'
import { HavingNode } from '../operation-node/having-node.js'
import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { AlterTableNode } from '../operation-node/alter-table-node.js'
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
import { UnionNode } from '../operation-node/union-node.js'
import { CreateViewNode } from '../operation-node/create-view-node.js'
import { DropViewNode } from '../operation-node/drop-view-node.js'
import { GeneratedAlwaysAsNode } from '../operation-node/generated-always-as-node.js'
import { DefaultValueNode } from '../operation-node/default-value-node.js'
import { OnNode } from '../operation-node/on-node.js'
import { ValuesNode } from '../operation-node/values-node.js'

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
      !CreateViewNode.is(this.parentNode) &&
      !UnionNode.is(this.parentNode) &&
      !InsertQueryNode.is(this.parentNode)

    if (wrapInParens) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('select ')

    if (node.distinctOnSelections) {
      this.compileDistinctOn(node.distinctOnSelections)
      this.append(' ')
    }

    if (node.distinct) {
      this.append('distinct')
      this.append(' ')
    }

    if (node.selections) {
      this.compileList(node.selections)
      this.append(' ')
    }

    this.visitNode(node.from)

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

    if (node.union) {
      this.append(' ')
      this.compileList(node.union, ' ')
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

    if (node.modifiers) {
      node.modifiers.forEach((modifier) => {
        this.append(' ')
        this.append(SELECT_MODIFIER_SQL[modifier])
      })
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

  protected compileDistinctOn(selections: ReadonlyArray<SelectionNode>): void {
    this.append('distinct on (')
    this.compileList(selections)
    this.append(')')
  }

  protected compileList(
    nodes: ReadonlyArray<OperationNode>,
    separator = ', '
  ): void {
    const lastNode = getLast(nodes)

    for (const node of nodes) {
      this.visitNode(node)

      if (node !== lastNode) {
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
    const isSubQuery = this.nodeStack.find(QueryNode.is) !== node

    if (isSubQuery) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('insert')

    if (node.ignore) {
      this.append(' ignore')
    }

    this.append(' into ')
    this.visitNode(node.into)

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    }

    if (node.values) {
      this.append(' ')
      this.visitNode(node.values)
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

    if (isSubQuery) {
      this.append(')')
    }
  }

  protected override visitValues(node: ValuesNode): void {
    this.append('values ')
    this.compileList(node.values)
  }

  protected override visitDeleteQuery(node: DeleteQueryNode): void {
    const isSubQuery = this.nodeStack.find(QueryNode.is) !== node

    if (isSubQuery) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('delete ')
    this.visitNode(node.from)

    if (node.joins) {
      this.append(' ')
      this.compileList(node.joins, ' ')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (isSubQuery) {
      this.append(')')
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
    this.visitNode(node.table)
    this.append('.')
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
    this.append(node.identifier)
  }

  protected override visitFilter(node: FilterNode): void {
    if (node.left) {
      this.visitNode(node.left)
      this.append(' ')
    }

    this.visitNode(node.op)
    this.append(' ')
    this.visitNode(node.right)
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

  protected override visitPrimitiveValueList(
    node: PrimitiveValueListNode
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
    node.sqlFragments.forEach((sql, i) => {
      this.append(sql)

      if (node.params.length > i) {
        this.visitNode(node.params[i])
      }
    })
  }

  protected override visitOperator(node: OperatorNode): void {
    this.append(node.operator)
  }

  protected override visitTable(node: TableNode): void {
    if (node.schema) {
      this.visitNode(node.schema)
      this.append('.')
    }

    this.visitNode(node.table)
  }

  protected override visitCreateTable(node: CreateTableNode): void {
    this.append('create ')

    if (node.temporary) {
      this.append('temporary ')
    }

    this.append('table ')

    if (node.ifNotExists) {
      this.append('if not exists ')
    }

    this.visitNode(node.table)
    this.append(' (')
    this.compileList([...node.columns, ...(node.constraints ?? [])])
    this.append(')')
  }

  protected override visitColumnDefinition(node: ColumnDefinitionNode): void {
    this.visitNode(node.column)

    this.append(' ')
    this.visitNode(node.dataType)

    if (node.generatedAlwaysAs) {
      this.append(' ')
      this.visitNode(node.generatedAlwaysAs)
    }

    if (node.defaultTo) {
      this.append(' ')
      this.visitNode(node.defaultTo)
    }

    if (!node.nullable) {
      this.append(' not null')
    }

    if (node.unique) {
      this.append(' unique')
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
    const isSubQuery = this.nodeStack.find(QueryNode.is) !== node

    if (isSubQuery) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('update ')
    this.visitNode(node.table)
    this.append(' set ')

    if (node.updates) {
      this.compileList(node.updates)
    }

    if (node.joins) {
      this.append(' ')
      this.compileList(node.joins, ' ')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (isSubQuery) {
      this.append(')')
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
    }

    if (node.constraint) {
      this.append(' on constraint ')
      this.visitNode(node.constraint)
    }

    if (node.doNothing === true) {
      this.append(' do nothing')
    } else if (node.updates) {
      this.append(' do update set ')
      this.compileList(node.updates)
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
    this.visitNode(node.name)

    if (node.table) {
      this.append(' on ')
      this.visitNode(node.table)
    }

    if (node.using) {
      this.append(' using ')
      this.visitNode(node.using)
    }

    if (node.expression) {
      this.append(' (')

      if (RawNode.is(node.expression)) {
        this.append('(')
      }

      this.visitNode(node.expression)

      if (RawNode.is(node.expression)) {
        this.append(')')
      }

      this.append(')')
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
  }

  protected override visitPrimaryKeyConstraint(
    node: PrimaryKeyConstraintNode
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

    this.append('unique (')
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
    node: ForeignKeyConstraintNode
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
    this.compileList(node.expressions)
  }

  protected override visitCommonTableExpression(
    node: CommonTableExpressionNode
  ): void {
    this.visitNode(node.name)
    this.append(' as ')
    this.visitNode(node.expression)
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

    if (node.renameColumn) {
      this.visitNode(node.renameColumn)
    }

    if (node.addColumn) {
      this.visitNode(node.addColumn)
    }

    if (node.dropColumn) {
      this.visitNode(node.dropColumn)
    }

    if (node.alterColumn) {
      this.visitNode(node.alterColumn)
    }

    if (node.modifyColumn) {
      this.visitNode(node.modifyColumn)
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
      this.append('type ')
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
    this.visitNode(node.constraintName)
  }

  protected override visitUnion(node: UnionNode): void {
    this.append('union ')

    if (node.all) {
      this.append('all ')
    }

    this.visitNode(node.union)
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
  }

  protected override visitGeneratedAlwaysAs(node: GeneratedAlwaysAsNode): void {
    this.append('generated always as (')
    this.visitNode(node.expression)
    this.append(')')

    if (node.stored) {
      this.append(' stored')
    }
  }

  protected override visitDefaultValue(node: DefaultValueNode): void {
    this.append('default ')
    this.visitNode(node.defaultValue)
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

  protected addParameter(parameter: unknown): void {
    this.#parameters.push(parameter)
  }

  protected appendImmediateValue(value: PrimitiveValue): void {
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
}

const SELECT_MODIFIER_SQL: Readonly<Record<SelectModifier, string>> = freeze({
  ForKeyShare: 'for key share',
  ForNoKeyUpdate: 'for no key update',
  ForUpdate: 'for update',
  ForShare: 'for share',
  NoWait: 'nowait',
  SkipLocked: 'skip locked',
})

const JOIN_TYPE_SQL: Readonly<Record<JoinType, string>> = freeze({
  InnerJoin: 'inner join',
  LeftJoin: 'left join',
  RightJoin: 'right join',
  FullJoin: 'full join',
})

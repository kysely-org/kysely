import { AliasNode } from '../operation-node/alias-node'
import { AndNode } from '../operation-node/and-node'
import { CheckConstraintNode } from '../operation-node/check-constraint-node'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node'
import { ColumnUpdateNode } from '../operation-node/column-update-node'
import { CreateIndexNode } from '../operation-node/create-index-node'
import { CreateTableNode } from '../operation-node/create-table-node'
import {
  ColumnDataType,
  DataTypeNode,
  dataTypeNode,
} from '../operation-node/data-type-node'
import { DeleteQueryNode } from '../operation-node/delete-query-node'
import { DropIndexNode } from '../operation-node/drop-index-node'
import { DropTableNode } from '../operation-node/drop-table-node'
import { FilterNode } from '../operation-node/filter-node'
import { FromNode } from '../operation-node/from-node'
import { GroupByItemNode } from '../operation-node/group-by-item-node'
import { GroupByNode } from '../operation-node/group-by-node'
import { IdentifierNode } from '../operation-node/identifier-node'
import { InsertQueryNode } from '../operation-node/insert-query-node'
import { JoinNode, JoinType } from '../operation-node/join-node'
import { LimitNode } from '../operation-node/limit-node'
import { ListNode } from '../operation-node/list-node'
import { OffsetNode } from '../operation-node/offset-node'
import { OnConflictNode } from '../operation-node/on-conflict-node'
import { OperationNode } from '../operation-node/operation-node'
import { OperationNodeVisitor } from '../operation-node/operation-node-visitor'
import { OperatorNode } from '../operation-node/operator-node'
import { OrNode } from '../operation-node/or-node'
import { OrderByItemNode } from '../operation-node/order-by-item-node'
import { OrderByNode } from '../operation-node/order-by-node'
import { ParensNode } from '../operation-node/parens-node'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node'
import { queryNode } from '../operation-node/query-node'
import { rawNode, RawNode } from '../operation-node/raw-node'
import { ReferenceNode } from '../operation-node/reference-node'
import { ReferencesNode } from '../operation-node/references-node'
import { ReturningNode } from '../operation-node/returning-node'
import { SelectAllNode } from '../operation-node/select-all-node'
import {
  SelectModifier,
  SelectQueryNode,
} from '../operation-node/select-query-node'
import { SelectionNode } from '../operation-node/selection-node'
import { TableNode } from '../operation-node/table-node'
import { TablePrimaryConstraintNode } from '../operation-node/table-primary-constraint-node'
import { TableUniqueConstraintNode } from '../operation-node/table-unique-constraint-node'
import { UpdateQueryNode } from '../operation-node/update-query-node'
import { ValueListNode } from '../operation-node/value-list-node'
import { ValueNode } from '../operation-node/value-node'
import { WhereNode } from '../operation-node/where-node'
import { CommonTableExpressionNode } from '../operation-node/common-table-expression-node'
import { WithNode } from '../operation-node/with-node'
import {
  isEmpty,
  getLast,
  freeze,
  isString,
  isNumber,
  isBoolean,
  isNull,
  PrimitiveValue,
  isDate,
  isBigInt,
} from '../util/object-utils'
import { CompiledQuery } from './compiled-query'
import { CompileEntryPointNode, QueryCompiler } from './query-compiler'
import { HavingNode } from '../operation-node/having-node'
import { CreateSchemaNode } from '../operation-node/create-schema-node'
import { DropSchemaNode } from '../operation-node/drop-schema-node'

export class DefaultQueryCompiler
  extends OperationNodeVisitor
  implements QueryCompiler
{
  #sqlFragments: string[] = []
  #bindings: any[] = []

  compileQuery(node: CompileEntryPointNode): CompiledQuery {
    this.#sqlFragments = []
    this.#bindings = []

    this.visitNode(node)

    return freeze({
      sql: this.getSql(),
      bindings: this.getBindings(),
    })
  }

  private getSql(): string {
    return this.#sqlFragments.join('')
  }

  private getBindings(): any[] {
    return this.#bindings
  }

  protected override visitSelectQuery(node: SelectQueryNode): void {
    const isSubQuery = this.nodeStack.find(queryNode.is) !== node

    if (isSubQuery) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('select ')

    if (node.distinctOnSelections && !isEmpty(node.distinctOnSelections)) {
      this.compileDistinctOn(node.distinctOnSelections)
      this.append(' ')
    }

    if (node.modifier === 'Distinct') {
      this.append(SELECT_MODIFIER_SQL[node.modifier])
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

    if (node.modifier) {
      this.append(' ')
      this.append(SELECT_MODIFIER_SQL[node.modifier])
    }

    if (isSubQuery) {
      this.append(')')
    }
  }

  protected override visitFrom(node: FromNode): void {
    this.append('from ')
    this.compileList(node.froms)
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
    const isSubQuery = this.nodeStack.find(queryNode.is) !== node

    if (isSubQuery) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('insert into ')
    this.visitNode(node.into)

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    }

    if (node.values) {
      this.append(' values ')
      this.compileList(node.values)
    }

    if (node.onConflict) {
      this.append(' ')
      this.visitNode(node.onConflict)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (isSubQuery) {
      this.append(')')
    }
  }

  protected override visitDeleteQuery(node: DeleteQueryNode): void {
    const isSubQuery = this.nodeStack.find(queryNode.is) !== node

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
    this.appendLeftIdentifierWrapper()
    this.compileUnwrappedIdentifier(node)
    this.appendRightIdentifierWrapper()
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
    this.append(' on ')

    if (node.on) {
      this.visitNode(node.on)
    }
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
    this.append('create table ')

    if (node.modifier === 'IfNotExists') {
      this.append('if not exists ')
    }

    this.visitNode(node.table)
    this.append(' (')
    this.compileList([
      ...node.columns,
      ...(node.primaryKeyConstraint ? [node.primaryKeyConstraint] : []),
      ...(node.uniqueConstraints ?? []),
      ...(node.checkConstraints ?? []),
    ])
    this.append(')')
  }

  protected override visitColumnDefinition(node: ColumnDefinitionNode): void {
    this.visitNode(node.column)
    this.append(' ')

    if (node.isAutoIncrementing) {
      // Postgres overrides the data type for autoincrementing columns.
      if (
        dataTypeNode.is(node.dataType) &&
        node.dataType.dataType === 'BigInteger'
      ) {
        this.append('bigserial')
      } else {
        this.append('serial')
      }
    } else {
      this.visitNode(node.dataType)
    }

    if (node.defaultTo) {
      this.append(' default ')
      this.visitNode(node.defaultTo)
    }

    if (!node.isNullable) {
      this.append(' not null')
    }

    if (node.isUnique) {
      this.append(' unique')
    }

    if (node.isPrimaryKey) {
      this.append(' primary key')
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

  protected override visitReferences(node: ReferencesNode): void {
    this.append('references ')
    this.visitNode(node.table)
    this.append(' (')
    this.visitNode(node.column)
    this.append(')')

    if (node.onDelete) {
      this.append(' on delete ')
      this.append(node.onDelete)
    }
  }

  protected override visitDropTable(node: DropTableNode): void {
    this.append('drop table ')

    if (node.modifier === 'IfExists') {
      this.append('if exists ')
    }

    this.visitNode(node.table)
  }

  protected override visitDataType(node: DataTypeNode): void {
    this.append(DATA_TYPE_SQL[node.dataType](node))
  }

  protected override visitOrderBy(node: OrderByNode): void {
    this.append('order by ')
    this.compileList(node.items)
  }

  protected override visitOrderByItem(node: OrderByItemNode): void {
    this.visitNode(node.orderBy)
    this.append(' ')
    this.append(node.direction)
  }

  protected override visitGroupBy(node: GroupByNode): void {
    this.append('group by ')
    this.compileList(node.items)
  }

  protected override visitGroupByItem(node: GroupByItemNode): void {
    this.visitNode(node.groupBy)
  }

  protected override visitUpdateQuery(node: UpdateQueryNode): void {
    const isSubQuery = this.nodeStack.find(queryNode.is) !== node

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
    this.append('on conflict ')

    this.append('(')
    this.compileList(node.columns)
    this.append(')')

    if (node.doNothing === true) {
      this.append(' do nothing')
    } else if (node.updates) {
      this.append(' do update set ')
      this.compileList(node.updates)
    }
  }

  protected override visitCreateIndex(node: CreateIndexNode): void {
    this.append('create ')

    if (node.unique) {
      this.append('unique ')
    }

    this.append('index ')
    this.visitNode(node.name)

    if (node.on) {
      this.append(' on ')
      this.visitNode(node.on)
    }

    if (node.using) {
      this.append(' using ')
      this.visitNode(node.using)
    }

    if (node.expression) {
      this.append(' (')

      if (rawNode.is(node.expression)) {
        this.append('(')
      }

      this.visitNode(node.expression)

      if (rawNode.is(node.expression)) {
        this.append(')')
      }

      this.append(')')
    }
  }

  protected override visitDropIndex(node: DropIndexNode): void {
    this.append('drop index ')

    if (node.modifier === 'IfExists') {
      this.append('if exists ')
    }

    this.visitNode(node.name)
  }

  protected override visitCreateSchema(node: CreateSchemaNode): void {
    this.append('create schema ')

    if (node.modifier === 'IfNotExists') {
      this.append('if not exists ')
    }

    this.visitNode(node.schema)
  }

  protected override visitDropSchema(node: DropSchemaNode): void {
    this.append('drop schema ')

    if (node.modifier === 'IfExists') {
      this.append('if exists ')
    }

    this.visitNode(node.schema)
  }

  protected override visitTablePrimaryConstraint(
    node: TablePrimaryConstraintNode
  ): void {
    this.append('primary key (')
    this.compileList(node.columns)
    this.append(')')
  }

  protected override visitTableUniqueConstraint(
    node: TableUniqueConstraintNode
  ): void {
    this.append('unique (')
    this.compileList(node.columns)
    this.append(')')
  }

  protected override visitCheckConstraint(node: CheckConstraintNode): void {
    this.append('check (')
    this.visitNode(node.expression)
    this.append(')')
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

  protected appendLeftIdentifierWrapper(): void {
    this.append('"')
  }

  protected appendRightIdentifierWrapper(): void {
    this.append('"')
  }

  protected append(str: string): void {
    this.#sqlFragments.push(str)
  }

  protected appendValue(value: PrimitiveValue): void {
    this.#bindings.push(value)
    this.append(`$${this.#bindings.length}`)
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

const SELECT_MODIFIER_SQL: Record<SelectModifier, string> = {
  Distinct: 'distinct',
  ForKeyShare: 'for key share',
  ForNoKeyUpdate: 'for no key update',
  ForUpdate: 'for update',
  ForShare: 'for share',
  NoWait: 'no wait',
  SkipLocked: 'skip locked',
}

const JOIN_TYPE_SQL: Record<JoinType, string> = {
  InnerJoin: 'inner join',
  LeftJoin: 'left join',
  RightJoin: 'right join',
  FullJoin: 'full join',
}

const DATA_TYPE_SQL: Record<ColumnDataType, (node: DataTypeNode) => string> = {
  BigInteger: () => 'bigint',
  Binary: () => '???',
  Boolean: () => 'boolean',
  Double: () => 'double precision',
  Float: () => 'real',
  Integer: () => 'integer',
  String: (node) => `varchar(${node.size ?? 255})`,
  Text: () => 'text',
  Numeric: (node) => `numeric(${node.precision}, ${node.scale})`,
  Decimal: (node) => `decimal(${node.precision}, ${node.scale})`,
  Date: () => 'date',
  DateTime: () => 'timestamp with time zone',
}

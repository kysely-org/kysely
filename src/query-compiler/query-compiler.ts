import { AliasNode } from '../operation-node/alias-node'
import { AndNode } from '../operation-node/and-node'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node'
import { CreateTableNode } from '../operation-node/create-table-node'
import { ColumnDataType, DataTypeNode } from '../operation-node/data-type-node'
import { DeleteNode } from '../operation-node/delete-node'
import { DropTableNode } from '../operation-node/drop-table-node'
import { FilterNode } from '../operation-node/filter-node'
import { FromNode } from '../operation-node/from-node'
import { IdentifierNode } from '../operation-node/identifier-node'
import { InsertNode } from '../operation-node/insert-node'
import { JoinNode, JoinType } from '../operation-node/join-node'
import { OperationNode } from '../operation-node/operation-node'
import { OperationNodeVisitor } from '../operation-node/operation-node-visitor'
import { OperatorNode } from '../operation-node/operator-node'
import { OrNode } from '../operation-node/or-node'
import { ParensNode } from '../operation-node/parens-node'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node'
import { QueryModifier, QueryNode } from '../operation-node/query-node'
import { RawNode } from '../operation-node/raw-node'
import { ReferenceNode } from '../operation-node/reference-node'
import { ReturningNode } from '../operation-node/returning-node'
import { SelectAllNode } from '../operation-node/select-all-node'
import { SelectNode } from '../operation-node/select-node'
import { SelectionNode } from '../operation-node/selection-node'
import { TableNode } from '../operation-node/table-node'
import { ValueListNode } from '../operation-node/value-list-node'
import { ValueNode } from '../operation-node/value-node'
import { WhereNode } from '../operation-node/where-node'
import { isEmpty, getLast, freeze } from '../utils/object-utils'
import { CompiledQuery } from './compiled-query'

export class QueryCompiler extends OperationNodeVisitor {
  #sqlFragments: string[] = []
  #bindings: any[] = []

  protected queryNodeStack: QueryNode[] = []

  compile(
    queryNode: QueryNode | CreateTableNode | DropTableNode
  ): CompiledQuery {
    this.#sqlFragments = []
    this.#bindings = []
    this.queryNodeStack = []

    this.visitNode(queryNode)

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

  protected visitQuery(node: QueryNode): void {
    const needsParens = !isEmpty(this.queryNodeStack)
    this.queryNodeStack.push(node)

    if (needsParens) {
      this.append('(')
    }

    if (node.insert) {
      this.visitNode(node.insert)
    }

    if (node.delete) {
      this.visitNode(node.delete)
    }

    if (node.select) {
      this.visitNode(node.select)
    }

    if (node.from) {
      this.append(' ')
      this.visitNode(node.from)
    }

    if (node.joins) {
      this.append(' ')
      node.joins.forEach(this.visitNode)
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.modifier) {
      this.append(' ')
      this.compileQueryModifier(node.modifier)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (needsParens) {
      this.append(')')
    }

    this.queryNodeStack.pop()
  }

  protected compileQueryModifier(modifier: QueryModifier): void {
    this.append(QUERY_MODIFIER_SQL[modifier])
  }

  protected visitFrom(node: FromNode): void {
    this.append('from ')
    this.compileList(node.froms)
  }

  protected visitSelect(node: SelectNode): void {
    this.append('select ')

    if (node.distinctOnSelections && !isEmpty(node.distinctOnSelections)) {
      this.compileDistinctOn(node.distinctOnSelections)
      this.append(' ')
    }

    if (node.modifier === 'Distinct') {
      this.append('distinct ')
    }

    if (node.selections) {
      this.compileList(node.selections)
    }
  }

  protected compileDistinctOn(selections: ReadonlyArray<SelectionNode>): void {
    this.append('distinct on (')
    this.compileList(selections)
    this.append(')')
  }

  protected compileList(nodes: ReadonlyArray<OperationNode>): void {
    const lastNode = getLast(nodes)

    for (const node of nodes) {
      this.visitNode(node)

      if (node !== lastNode) {
        this.append(', ')
      }
    }
  }

  protected visitWhere(node: WhereNode): void {
    this.append('where ')
    this.visitNode(node.where)
  }

  protected visitInsert(node: InsertNode): void {
    this.append('insert into ')
    this.visitNode(node.into)

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    }

    if (node.values) {
      this.append(' values ')

      if (node.values.length === 1) {
        this.visitNode(node.values[0])
      } else {
        this.compileList(node.values)
      }
    }
  }

  protected visitDelete(node: DeleteNode): void {
    this.append('delete from ')
    this.visitNode(node.from)
  }

  protected visitReturning(node: ReturningNode): void {
    this.append('returning ')
    this.compileList(node.selections)
  }

  protected visitAlias(node: AliasNode): void {
    this.visitNode(node.node)
    this.append(' as ')
    this.visitNode(node.alias)
  }

  protected visitReference(node: ReferenceNode): void {
    this.visitNode(node.table)
    this.append('.')
    this.visitNode(node.column)
  }

  protected visitSelectAll(_: SelectAllNode): void {
    this.append('*')
  }

  protected visitIdentifier(node: IdentifierNode): void {
    this.appendLeftIdentifierWrapper()
    this.compileUnwrappedIdentifier(node)
    this.appendRightIdentifierWrapper()
  }

  protected compileUnwrappedIdentifier(node: IdentifierNode): void {
    this.append(node.identifier)
  }

  protected visitFilter(node: FilterNode): void {
    if (node.lhs) {
      this.visitNode(node.lhs)
      this.append(' ')
    }

    this.visitNode(node.op)
    this.append(' ')
    this.visitNode(node.rhs)
  }

  protected visitAnd(node: AndNode): void {
    this.visitNode(node.lhs)
    this.append(' and ')
    this.visitNode(node.rhs)
  }

  protected visitOr(node: OrNode): void {
    this.visitNode(node.lhs)
    this.append(' or ')
    this.visitNode(node.rhs)
  }

  protected visitValue(node: ValueNode): void {
    this.appendValue(node.value)
  }

  protected visitValueList(node: ValueListNode): void {
    this.append('(')
    this.compileList(node.values)
    this.append(')')
  }

  protected visitPrimitiveValueList(node: PrimitiveValueListNode): void {
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

  protected visitParens(node: ParensNode): void {
    this.append('(')
    this.visitNode(node.node)
    this.append(')')
  }

  protected visitJoin(node: JoinNode): void {
    this.append(JOIN_TYPE_SQL[node.joinType])
    this.append(' ')
    this.visitNode(node.table)
    this.append(' on ')

    if (node.on) {
      this.visitNode(node.on)
    }
  }

  protected visitRaw(node: RawNode): void {
    node.sqlFragments.forEach((sql, i) => {
      this.append(sql)

      if (node.params.length > i) {
        this.visitNode(node.params[i])
      }
    })
  }

  protected visitOperator(node: OperatorNode): void {
    this.append(node.operator)
  }

  protected visitTable(node: TableNode): void {
    if (node.schema) {
      this.visitNode(node.schema)
      this.append('.')
    }

    this.visitNode(node.table)
  }

  protected visitCreateTable(node: CreateTableNode): void {
    this.append('create table ')
    this.visitNode(node.table)
    this.append(' (')
    this.compileList(node.columns)
    this.append(')')
  }

  protected visitColumnDefinition(node: ColumnDefinitionNode): void {
    this.visitNode(node.column)
    this.append(' ')

    if (node.isAutoIncrementing) {
      this.append('serial')
    } else {
      this.visitNode(node.dataType)
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
      this.append(' references ')
      this.visitNode(node.references.table)
      this.append('(')
      this.visitNode(node.references.column)
      this.append(')')
    }
  }

  protected visitDropTable(node: DropTableNode): void {
    this.append('drop table ')

    if (node.modifier === 'IfExists') {
      this.append('if exists ')
    }

    this.visitNode(node.table)
  }

  protected visitDataType(node: DataTypeNode): void {
    this.append(DATA_TYPE_SQL[node.dataType](node))
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

  protected appendValue(value: any): void {
    this.#bindings.push(value)
    this.append(`$${this.#bindings.length}`)
  }
}

const QUERY_MODIFIER_SQL: Record<QueryModifier, string> = {
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
}

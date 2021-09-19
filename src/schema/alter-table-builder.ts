import { addColumnNode } from '../operation-node/add-column-node.js'
import {
  alterColumnNode,
  AlterColumnNode,
} from '../operation-node/alter-column-node.js'
import {
  alterTableNode,
  AlterTableNode,
} from '../operation-node/alter-table-node.js'
import { columnDefinitionNode } from '../operation-node/column-definition-node.js'
import {
  ColumnDataType,
  dataTypeNode,
} from '../operation-node/data-type-node.js'
import { dropColumnNode } from '../operation-node/drop-column-node.js'
import { identifierNode } from '../operation-node/identifier-node.js'
import {
  isOperationNodeSource,
  OperationNodeSource,
} from '../operation-node/operation-node-source.js'
import { OnDelete } from '../operation-node/references-node.js'
import { renameColumnNode } from '../operation-node/rename-column-node.js'
import { tableNode } from '../operation-node/table-node.js'
import { valueNode } from '../operation-node/value-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { Compilable } from '../util/compilable.js'
import { PrimitiveValue } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import {
  ColumnDefinitionBuilder,
  ColumnDefinitionBuilderInterface,
} from './column-definition-builder.js'

export class AlterTableBuilder {
  readonly #alterTableNode: AlterTableNode
  readonly #executor: QueryExecutor

  constructor(args: AlterTableBuilderConstructorArgs) {
    this.#alterTableNode = args.alterTableNode
    this.#executor = args.executor
  }

  renameTo(newTableName: string): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        renameTo: tableNode.create(newTableName),
      }),
    })
  }

  setSchema(newSchema: string): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        setSchema: identifierNode.create(newSchema),
      }),
    })
  }

  alterColumn(column: string): AlterColumnBuilder {
    return new AlterColumnBuilder({
      alterTableNode: this.#alterTableNode,
      alterColumnNode: alterColumnNode.create(column),
      executor: this.#executor,
    })
  }

  dropColumn(column: string): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        dropColumn: dropColumnNode.create(column),
      }),
    })
  }

  renameColumn(column: string, newColumn: string): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        renameColumn: renameColumnNode.create(column, newColumn),
      }),
    })
  }

  addColumn(
    columnName: string,
    dataType: ColumnDataType | RawBuilder
  ): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: new ColumnDefinitionBuilder(
        columnDefinitionNode.create(
          columnName,
          isOperationNodeSource(dataType)
            ? dataType.toOperationNode()
            : dataTypeNode.create(dataType)
        )
      ),
    })
  }
}

export class AlterColumnBuilder {
  readonly #alterTableNode: AlterTableNode
  readonly #alterColumnNode: AlterColumnNode
  readonly #executor: QueryExecutor

  constructor(args: AlterColumnBuilderConstructorArgs) {
    this.#alterTableNode = args.alterTableNode
    this.#alterColumnNode = args.alterColumnNode
    this.#executor = args.executor
  }

  setDataType(dataType: ColumnDataType): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        alterColumn: alterColumnNode.cloneWith(this.#alterColumnNode, {
          dataType: dataTypeNode.create(dataType),
        }),
      }),
    })
  }

  setDefault(value: PrimitiveValue | RawBuilder<any>): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        alterColumn: alterColumnNode.cloneWith(this.#alterColumnNode, {
          setDefault: isOperationNodeSource(value)
            ? value.toOperationNode()
            : valueNode.createImmediate(value),
        }),
      }),
    })
  }

  dropDefault(): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        alterColumn: alterColumnNode.cloneWith(this.#alterColumnNode, {
          dropDefault: true,
        }),
      }),
    })
  }

  setNotNull(): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        alterColumn: alterColumnNode.cloneWith(this.#alterColumnNode, {
          setNotNull: true,
        }),
      }),
    })
  }

  dropNotNull(): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        alterColumn: alterColumnNode.cloneWith(this.#alterColumnNode, {
          dropNotNull: true,
        }),
      }),
    })
  }
}

export class AlterTableExecutor implements OperationNodeSource, Compilable {
  readonly #alterTableNode: AlterTableNode
  readonly #executor: QueryExecutor

  constructor(args: AlterTableExecutorConstructorArgs) {
    this.#alterTableNode = args.alterTableNode
    this.#executor = args.executor
  }

  toOperationNode(): AlterTableNode {
    return this.#executor.transformNode(this.#alterTableNode)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }
}

export class AlterTableAddColumnBuilder
  implements ColumnDefinitionBuilderInterface<AlterTableAddColumnBuilder>
{
  readonly #alterTableNode: AlterTableNode
  readonly #executor: QueryExecutor
  readonly #columnBuilder: ColumnDefinitionBuilder

  constructor(args: AlterTableAddColumnBuilderConstructorArgs) {
    this.#alterTableNode = args.alterTableNode
    this.#executor = args.executor
    this.#columnBuilder = args.columnBuilder
  }

  increments(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.increments(),
    })
  }

  primaryKey(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.primaryKey(),
    })
  }

  references(ref: string): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.references(ref),
    })
  }

  onDelete(onDelete: OnDelete): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.onDelete(onDelete),
    })
  }

  unique(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.unique(),
    })
  }

  notNull(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.notNull(),
    })
  }

  defaultTo(
    value: PrimitiveValue | RawBuilder<any>
  ): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.defaultTo(value),
    })
  }

  check(sql: string): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      executor: this.#executor,
      alterTableNode: this.#alterTableNode,
      columnBuilder: this.#columnBuilder.check(sql),
    })
  }

  toOperationNode(): AlterTableNode {
    return this.#executor.transformNode(
      alterTableNode.cloneWith(this.#alterTableNode, {
        addColumn: addColumnNode.create(this.#columnBuilder.toOperationNode()),
      })
    )
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }
}

preventAwait(AlterTableBuilder, "don't await AlterTableBuilder instances")
preventAwait(AlterColumnBuilder, "don't await AlterColumnBuilder instances")

preventAwait(
  AlterTableExecutor,
  "don't await AlterTableExecutor instances directly. To execute the query you need to call `execute`"
)

preventAwait(
  AlterTableAddColumnBuilder,
  "don't await AlterTableAddColumnBuilder instances directly. To execute the query you need to call `execute`"
)

export interface AlterTableBuilderConstructorArgs {
  alterTableNode: AlterTableNode
  executor: QueryExecutor
}

export interface AlterColumnBuilderConstructorArgs
  extends AlterTableBuilderConstructorArgs {
  alterColumnNode: AlterColumnNode
}

export interface AlterTableExecutorConstructorArgs
  extends AlterTableBuilderConstructorArgs {}

export interface AlterTableAddColumnBuilderConstructorArgs
  extends AlterTableBuilderConstructorArgs {
  columnBuilder: ColumnDefinitionBuilder
}

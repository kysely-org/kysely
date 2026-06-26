import type { UpdateQueryBuilder } from '../query-builder/update-query-builder.js'
import type { DeleteQueryBuilder } from '../query-builder/delete-query-builder.js'
import type { InsertQueryBuilder } from '../query-builder/insert-query-builder.js'
import { CommonTableExpressionNameNode } from '../operation-node/common-table-expression-name-node.js'
import type { QueryCreator } from '../query-creator.js'
import { createQueryCreator } from './parse-utils.js'
import { isFunction } from '../util/object-utils.js'
import {
  CTEBuilder,
  type CTEBuilderCallback,
} from '../query-builder/cte-builder.js'
import { CommonTableExpressionNode } from '../operation-node/common-table-expression-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import type { Compilable } from '../util/compilable.js'
import type { Expression } from '../expression/expression.js'
import type { ShallowRecord } from '../util/type-utils.js'
import type { OperationNode } from '../operation-node/operation-node.js'

export type CommonTableExpression<DB, CN> =
  | CommonTableExpressionOutput<DB, CN>
  | CommonTableExpressionFactory<DB, CN>

export type CommonTableExpressionFactory<DB, CN> = (
  creator: QueryCreator<DB>,
) => CommonTableExpressionOutput<DB, CN>

export type RecursiveCommonTableExpression<DB, CN extends string> = (
  creator: QueryCreator<
    DB & {
      // Recursive CTE can select from itself.
      [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpressionName<CN>
    }
  >,
) => CommonTableExpressionOutput<DB, CN>

export type QueryCreatorWithCommonTableExpression<
  DB,
  CN extends string,
  CTE,
> = QueryCreator<
  DB & {
    [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpression<CTE>
  }
>

export type CommonTableExpressionOutput<DB, CN> =
  | Expression<ExtractRowFromCommonTableExpressionName<CN>>
  | InsertQueryBuilder<DB, any, ExtractRowFromCommonTableExpressionName<CN>>
  | UpdateQueryBuilder<
      DB,
      any,
      any,
      ExtractRowFromCommonTableExpressionName<CN>
    >
  | DeleteQueryBuilder<DB, any, ExtractRowFromCommonTableExpressionName<CN>>

/**
 * Given a common CommonTableExpression CTE extracts the row type from it.
 *
 * For example a CTE `(db) => db.selectFrom('person').select(['id', 'first_name'])`
 * would result in `Pick<Person, 'id' | 'first_name'>`.
 */
export type ExtractRowFromCommonTableExpression<CTE> = CTE extends
  | Expression<infer O>
  | Compilable<infer O>
  ? O
  : CTE extends (creator: QueryCreator<any>) => infer Q
    ? Q extends Expression<infer O> | Compilable<infer O>
      ? O
      : never
    : never

/**
 * Extracts 'person' from a string like 'person(id, first_name)'.
 */
export type ExtractTableFromCommonTableExpressionName<CN> =
  CN extends `${infer TB}(${string})` ? TB : CN

/**
 * Parses a string like 'person(id, first_name)' into a type:
 *
 * {
 *   id: any,
 *   first_name: any
 * }
 */
export type ExtractRowFromCommonTableExpressionName<CN> =
  CN extends `${string}(${infer CL})`
    ? { [C in ExtractColumnNamesFromColumnList<CL>]: any }
    : ShallowRecord<string, any>

/**
 * Parses a string like 'id, first_name' into a type 'id' | 'first_name'
 */
type ExtractColumnNamesFromColumnList<R> = R extends `${infer C}, ${infer RS}`
  ? C | ExtractColumnNamesFromColumnList<RS>
  : R

export function parseCommonTableExpression(
  nameOrBuilderCallback: string | CTEBuilderCallback<string>,
  expression: CommonTableExpression<any, string>,
): CommonTableExpressionNode {
  const expressionNode = isOperationNodeSource(expression)
    ? expression.toOperationNode()
    : expression(createQueryCreator()).toOperationNode()

  if (isFunction(nameOrBuilderCallback)) {
    return nameOrBuilderCallback(
      cteBuilderFactory(expressionNode),
    ).toOperationNode()
  }

  return CommonTableExpressionNode.create(
    parseCommonTableExpressionName(nameOrBuilderCallback),
    expressionNode,
  )
}

function cteBuilderFactory(expressionNode: OperationNode) {
  return (name: string) => {
    return new CTEBuilder({
      node: CommonTableExpressionNode.create(
        parseCommonTableExpressionName(name),
        expressionNode,
      ),
    })
  }
}

function parseCommonTableExpressionName(
  name: string,
): CommonTableExpressionNameNode {
  if (name.includes('(')) {
    const parts = name.split(/[\(\)]/)
    const table = parts[0]
    const columns = parts[1].split(',').map((it) => it.trim())

    return CommonTableExpressionNameNode.create(table, columns)
  } else {
    return CommonTableExpressionNameNode.create(name)
  }
}

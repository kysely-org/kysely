import { UpdateQueryBuilder } from '../query-builder/update-query-builder.js'
import { DeleteQueryBuilder } from '../query-builder/delete-query-builder.js'
import { InsertQueryBuilder } from '../query-builder/insert-query-builder.js'
import { CommonTableExpressionNameNode } from '../operation-node/common-table-expression-name-node.js'
import { QueryCreator } from '../query-creator.js'
import { Expression } from '../expression/expression.js'
import { DrainOuterGeneric, ShallowRecord } from '../util/type-utils.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { createQueryCreator } from './parse-utils.js'
import { isFunction } from '../util/object-utils.js'
import { CTEBuilder, CTEBuilderCallback } from '../query-builder/cte-builder.js'
import { CommonTableExpressionNode } from '../operation-node/common-table-expression-node.js'
import { Database } from '../database.js'

export type CommonTableExpression<DB extends Database, CN extends string> = (
  creator: QueryCreator<DB>
) => CommonTableExpressionOutput<DB, CN>

export type RecursiveCommonTableExpression<
  DB extends Database,
  CN extends string
> = (
  creator: QueryCreator<
    DrainOuterGeneric<{
      tables: DB['tables'] & {
        // Recursive CTE can select from itself.
        [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpressionName<CN>
      }
      config: DB['config']
    }>
  >
) => CommonTableExpressionOutput<DB, CN>

export type QueryCreatorWithCommonTableExpression<
  DB extends Database,
  CN extends string,
  CTE
> = DrainOuterGeneric<
  QueryCreator<{
    tables: DB['tables'] & {
      [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpression<CTE>
    }
    config: DB['config']
  }>
>

type CommonTableExpressionOutput<DB extends Database, CN extends string> =
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
 * would result in `Pick<Person, 'id' | 'first_name'>`.
 */
type ExtractRowFromCommonTableExpression<CTE> = CTE extends (
  creator: QueryCreator<any>
) => infer Q
  ? Q extends Expression<infer QO>
    ? QO
    : Q extends InsertQueryBuilder<any, any, infer QO>
    ? QO
    : Q extends UpdateQueryBuilder<any, any, any, infer QO>
    ? QO
    : Q extends DeleteQueryBuilder<any, any, infer QO>
    ? QO
    : never
  : never

/**
 * Extracts 'person' from a string like 'person(id, first_name)'.
 */
type ExtractTableFromCommonTableExpressionName<CN extends string> =
  CN extends `${infer TB}(${string})` ? TB : CN

/**
 * Parses a string like 'person(id, first_name)' into a type:
 *
 * {
 *   id: any,
 *   first_name: any
 * }
 *
 */
type ExtractRowFromCommonTableExpressionName<CN extends string> =
  CN extends `${string}(${infer CL})`
    ? { [C in ExtractColumnNamesFromColumnList<CL>]: any }
    : ShallowRecord<string, any>

/**
 * Parses a string like 'id, first_name' into a type 'id' | 'first_name'
 */
type ExtractColumnNamesFromColumnList<R extends string> =
  R extends `${infer C}, ${infer RS}`
    ? C | ExtractColumnNamesFromColumnList<RS>
    : R

export function parseCommonTableExpression(
  nameOrBuilderCallback: string | CTEBuilderCallback<string>,
  expression: CommonTableExpression<any, string>
): CommonTableExpressionNode {
  const expressionNode = expression(createQueryCreator()).toOperationNode()

  if (isFunction(nameOrBuilderCallback)) {
    return nameOrBuilderCallback(
      cteBuilderFactory(expressionNode)
    ).toOperationNode()
  }

  return CommonTableExpressionNode.create(
    parseCommonTableExpressionName(nameOrBuilderCallback),
    expressionNode
  )
}

function cteBuilderFactory(expressionNode: OperationNode) {
  return (name: string) => {
    return new CTEBuilder({
      node: CommonTableExpressionNode.create(
        parseCommonTableExpressionName(name),
        expressionNode
      ),
    })
  }
}

function parseCommonTableExpressionName(
  name: string
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

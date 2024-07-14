import { ColumnNode } from '../operation-node/column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import {
  expressionBuilder,
  ExpressionBuilder,
} from '../expression/expression-builder.js'
import { UpdateKeys, UpdateType } from '../util/column-type.js'
import { isFunction } from '../util/object-utils.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'
import {
  ExtractRawTypeFromReferenceExpression,
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'
import { AnyColumn, DrainOuterGeneric } from '../util/type-utils.js'

export type UpdateObject<
  DB,
  TB extends keyof DB,
  UT extends keyof DB = TB,
> = DrainOuterGeneric<{
  [C in AnyColumn<DB, UT>]?: {
    [T in UT]: C extends keyof DB[T]
      ? ValueExpression<DB, TB, UpdateType<DB[T][C]>> | undefined
      : never
  }[UT]
}>

export type UpdateObjectFactory<
  DB,
  TB extends keyof DB,
  UT extends keyof DB,
> = (eb: ExpressionBuilder<DB, TB>) => UpdateObject<DB, TB, UT>

export type UpdateObjectExpression<
  DB,
  TB extends keyof DB,
  UT extends keyof DB = TB,
> = UpdateObject<DB, TB, UT> | UpdateObjectFactory<DB, TB, UT>

export type ExtractUpdateTypeFromReferenceExpression<
  DB,
  TB extends keyof DB,
  RE,
  DV = unknown,
> = UpdateType<ExtractRawTypeFromReferenceExpression<DB, TB, RE, DV>>

export function parseUpdate(
  ...args:
    | [UpdateObjectExpression<any, any, any>]
    | [ReferenceExpression<any, any>, ValueExpression<any, any, any>]
): ReadonlyArray<ColumnUpdateNode> {
  if (args.length === 2) {
    return [
      ColumnUpdateNode.create(
        parseReferenceExpression(args[0]),
        parseValueExpression(args[1]),
      ),
    ]
  }

  return parseUpdateObjectExpression(args[0])
}

export function parseUpdateObjectExpression(
  update: UpdateObjectExpression<any, any, any>,
): ReadonlyArray<ColumnUpdateNode> {
  const updateObj = isFunction(update) ? update(expressionBuilder()) : update

  return Object.entries(updateObj)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      return ColumnUpdateNode.create(
        ColumnNode.create(key),
        parseValueExpression(value),
      )
    })
}

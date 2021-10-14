import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OnConflictNode } from '../operation-node/on-conflict-node.js'
import { AnyColumn } from '../query-builder/type-utils.js'
import {
  asReadonlyArray,
  isObject,
  isReadonlyArray,
  isString,
} from '../util/object-utils.js'
import { MutationObject } from './mutation-parser.js'
import { parseColumnName } from './reference-parser.js'
import { parseUpdateObject } from './update-set-parser.js'

export type OnConflictConstraintTarget = { constraint: string }

export type OnConflictTargetExpression<DB, TB extends keyof DB> =
  | AnyColumn<DB, TB>
  | ReadonlyArray<AnyColumn<DB, TB>>
  | OnConflictConstraintTarget

export function parseOnConflictDoNothing(
  target: OnConflictTargetExpression<any, any>
): OnConflictNode {
  return OnConflictNode.create({
    ...parseConflictTarget(target),
    doNothing: true,
  })
}

export function parseOnConflictUpdate(
  target: OnConflictTargetExpression<any, any>,
  updates: MutationObject<any, any>
): OnConflictNode {
  return OnConflictNode.create({
    ...parseConflictTarget(target),
    updates: parseUpdateObject(updates),
  })
}

function parseConflictTarget(target: OnConflictTargetExpression<any, any>) {
  if (isString(target) || isReadonlyArray(target)) {
    return {
      columns: asReadonlyArray(target).map(parseColumnName),
    }
  }

  if (isObject(target) && !isReadonlyArray(target)) {
    return {
      constraint: IdentifierNode.create(target.constraint),
    }
  }

  throw new Error(`invalid on conflict target ${JSON.stringify(target)}`)
}

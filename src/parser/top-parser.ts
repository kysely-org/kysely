import { TopModifier, TopNode } from '../operation-node/top-node'
import { isBigInt, isNumber, isString } from '../util/object-utils'

export function parseTop(
  expression: number | bigint,
  modifiers?: TopModifier,
): TopNode {
  if (!isNumber(expression) && !isBigInt(expression)) {
    throw new Error(`Invalid top expression: ${expression}`)
  }

  if (!isString(modifiers) || !isTopModifiers(modifiers)) {
    throw new Error(`Invalid top modifiers: ${modifiers}`)
  }

  return TopNode.create(expression, modifiers)
}

function isTopModifiers(modifiers: string): modifiers is TopModifier {
  return (
    modifiers === 'percent' ||
    modifiers === 'with ties' ||
    modifiers === 'percent with ties'
  )
}

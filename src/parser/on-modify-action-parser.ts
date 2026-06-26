import {
  isOnModifyForeignAction,
  type OnModifyForeignAction,
} from '../operation-node/references-node.js'

export function parseOnModifyForeignAction(
  action: string,
): OnModifyForeignAction {
  if (isOnModifyForeignAction(action)) {
    return action
  }

  throw new Error(`invalid OnModifyForeignAction ${action}`)
}

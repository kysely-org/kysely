import {
  type OnModifyForeignAction,
  ON_MODIFY_FOREIGN_ACTIONS_RECORD,
} from '../operation-node/references-node.js'

export function parseOnModifyForeignAction(
  action: string,
): OnModifyForeignAction {
  if (ON_MODIFY_FOREIGN_ACTIONS_RECORD[action as never]) {
    return action as never
  }

  throw new Error(`invalid OnModifyForeignAction ${action}`)
}

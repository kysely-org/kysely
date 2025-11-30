import type { CheckConstraintNode } from './check-constraint-node.js'
import type { ForeignKeyConstraintNode } from './foreign-key-constraint-node.js'
import type { PrimaryKeyConstraintNode } from './primary-key-constraint-node.js'
import type { UniqueConstraintNode } from './unique-constraint-node.js'

export type ConstraintNode =
  | PrimaryKeyConstraintNode
  | UniqueConstraintNode
  | CheckConstraintNode
  | ForeignKeyConstraintNode

import { CheckConstraintNode } from "./check-constraint-node";
import { ForeignKeyConstraintNode } from "./foreign-key-constraint-node";
import { PrimaryKeyConstraintNode } from "./primary-constraint-node";
import { UniqueConstraintNode } from "./unique-constraint-node";

export type ConstraintNode =
  | PrimaryKeyConstraintNode
  | UniqueConstraintNode
  | CheckConstraintNode
  | ForeignKeyConstraintNode

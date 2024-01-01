import { ExpressionBuilder } from '../expression/expression-builder.js'
import { AliasedExpressionOrFactory } from '../parser/expression-parser.js'
import { ReturningAllRow, ReturningRow } from '../parser/returning-parser.js'
import {
  AnyAliasedColumnWithTable,
  AnyColumnWithTable,
} from '../util/type-utils.js'

export interface OutputInterface<
  DB,
  TB extends keyof DB,
  O,
  OP extends OutputPrefix = OutputPrefix
> {
  /**
   * TODO: ...
   */
  output<OE extends OutputExpression<DB, TB, OP>>(
    selections: ReadonlyArray<OE>
  ): OutputInterface<
    DB,
    TB,
    ReturningRow<DB, TB, O, SelectExpressionFromOutputExpression<OE>>,
    OP
  >

  output<CB extends OutputCallback<DB, TB, OP>>(
    callback: CB
  ): OutputInterface<
    DB,
    TB,
    ReturningRow<DB, TB, O, SelectExpressionFromOutputCallback<CB>>,
    OP
  >

  output<OE extends OutputExpression<DB, TB, OP>>(
    selection: OE
  ): OutputInterface<
    DB,
    TB,
    ReturningRow<DB, TB, O, SelectExpressionFromOutputExpression<OE>>,
    OP
  >

  /**
   * TODO: ...
   */
  outputAll(table: OP): OutputInterface<DB, TB, ReturningAllRow<DB, TB, O>, OP>
}

export type OutputPrefix = 'deleted' | 'inserted'

export type OutputDatabase<
  DB,
  TB extends keyof DB,
  OP extends OutputPrefix = OutputPrefix
> = {
  [K in OP]: DB[TB]
}

export type OutputExpression<
  DB,
  TB extends keyof DB,
  OP extends OutputPrefix,
  ODB = OutputDatabase<DB, TB, OP>,
  OTB extends keyof ODB = keyof ODB
> =
  | AnyAliasedColumnWithTable<ODB, OTB>
  | AnyColumnWithTable<ODB, OTB>
  | AliasedExpressionOrFactory<ODB, OTB>

export type OutputCallback<DB, TB extends keyof DB, OP extends OutputPrefix> = (
  eb: ExpressionBuilder<OutputDatabase<DB, TB, OP>, OP>
) => ReadonlyArray<OutputExpression<DB, TB, OP>>

export type SelectExpressionFromOutputExpression<OE> =
  OE extends `${OutputPrefix}.${infer C}` ? C : OE

export type SelectExpressionFromOutputCallback<CB> = CB extends (
  eb: ExpressionBuilder<any, any>
) => ReadonlyArray<infer OE>
  ? SelectExpressionFromOutputExpression<OE>
  : never

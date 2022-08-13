import { ColumnDataType } from '../../operation-node/data-type-node.js'
import { RawBuilder } from '../../raw-builder/raw-builder.js'
import { sql } from '../../raw-builder/sql.js'

export type Caster = (
  serializedValue: unknown,
  value: unknown
) => RawBuilder<unknown>
export type Serializer = (parameter: unknown) => unknown

export const createDefaultPostgresCaster: (castTo: ColumnDataType) => Caster =
  (castTo = 'jsonb') =>
  (serializedValue) =>
    sql`${serializedValue}::${sql.raw(castTo)}`

export const defaultSerializer: Serializer = (parameter) => {
  if (parameter && typeof parameter === 'object') {
    return JSON.stringify(parameter)
  }

  return parameter
}

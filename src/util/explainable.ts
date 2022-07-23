import { Compilable } from './compilable.js'
import { AnyRawBuilder } from './type-utils.js'

export type ExplainFormat =
  | 'text'
  | 'xml'
  | 'json'
  | 'yaml'
  | 'traditional'
  | 'tree'

export interface Explainable {
  explain<O extends Record<string, any> = Record<string, any>>(
    format?: ExplainFormat,
    options?: AnyRawBuilder
  ): Promise<O[]>
}

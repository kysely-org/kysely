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
  explain(format?: ExplainFormat, options?: AnyRawBuilder): Compilable
}

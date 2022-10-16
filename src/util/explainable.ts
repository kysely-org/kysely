import { Expression } from '../expression/expression.js'

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
    options?: Expression<any>
  ): Promise<O[]>
}

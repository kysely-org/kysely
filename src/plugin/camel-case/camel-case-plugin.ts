import { IdentifierNode } from '../../operation-node/identifier-node'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer'
import { isObject } from '../../util/object-utils'
import { KyselyPlugin } from '../plugin'

export interface CamelCasePluginOptions {
  /**
   * If true, camelCase is transformed into upper case SNAKE_CASE.
   * For example `fooBar => FOO_BAR` and `FOO_BAR => fooBar`
   *
   * Defaults to false.
   */
  upperCase?: boolean

  /**
   * If true, an underscore is added before each digit when converting
   * camelCase to snake_case. For example `foo1Bar => foo_1_bar` and
   * `foo_1_bar => foo1Bar`
   *
   * Defaults to false.
   */
  underscoreBeforeDigits?: boolean

  /**
   * If true, an underscore is added between consecutive upper case
   * letters when converting from camelCase to snake_case. For example
   * `fooBAR => foo_b_a_r` and `foo_b_a_r => fooBAR`.
   *
   * Defaults to false.
   */
  underscoreBetweenUppercaseLetters?: boolean
}

/**
 * A plugin that converts snake_case identifiers in the database into
 * camelCase in the javascript side.
 *
 * For example let's assume we have a table called `person_table`
 * with columns `first_name` and `last_name` in the database. When
 * using `CamelCasePlugin` one would setup Kysely like this:
 *
 * ```ts
 * interface Person {
 *   firstName: string
 *   lastName: string
 * }
 *
 * interface Database {
 *   personTable: Person
 * }
 *
 * const db = new Kysely<Database>({
 *  dialect: 'postgres',
 *  database: 'kysely_test',
 *  host: 'localhost',
 *  plugins: [
 *    new CamelCasePlugin()
 *  ]
 * })
 *
 * const person = await db.selectFrom('personTable')
 *   .where('firstName', '=', 'Arnold')
 *   .select(['firstName', 'lastName'])
 *   .executeTakeFirst()
 *
 * // generated sql:
 * // select first_name, last_name from person_table where first_name = $1
 *
 * if (person) {
 *   console.log(person.firstName)
 * }
 * ```
 *
 * As you can see from the example, __everything__ needs to be defined
 * in camelCase in the typescript code: the table names, the columns,
 * schemas, __everything__. When using the `CamelCasePlugin` Kysely
 * works as if the database was defined in camelCase.
 *
 * There are various options you can give to the plugin to modify
 * the way identifiers are converted. See {@link CamelCasePluginOptions}.
 * If those options are not enough, you can override this plugin's
 * `snakeCase` and `camelCase` methods to make the conversion exactly
 * the way you like:
 *
 * ```ts
 * class MyCamelCasePlugin extends CamelCasePlugin {
 *   protected override snakeCase(str: string): string {
 *     return mySnakeCase(str)
 *   }
 *
 *    protected override camelCase(str: string): string {
 *     return myCamelCase(str)
 *   }
 * }
 * ```
 */
export class CamelCasePlugin implements KyselyPlugin {
  readonly #camelCase: StringMapper
  readonly #snakeCase: StringMapper

  constructor(opt: CamelCasePluginOptions = {}) {
    this.#camelCase = createCamelCase(opt)
    this.#snakeCase = createSnakeCase(opt)
  }

  createTransformers(): OperationNodeTransformer[] {
    return [new SnakeCaseTransformer(this.snakeCase.bind(this))]
  }

  mapRow(row: Record<string, any>): Record<string, any> {
    return Object.keys(row).reduce<Record<string, any>>((obj, key) => {
      let value = row[key]

      if (Array.isArray(value)) {
        value = value.map((it) => (canMap(it) ? this.mapRow(it) : it))
      } else if (canMap(value)) {
        value = this.mapRow(value)
      }

      obj[this.#camelCase(key)] = value
      return obj
    }, {})
  }

  protected snakeCase(str: string): string {
    return this.#snakeCase(str)
  }

  protected camelCase(str: string): string {
    return this.#camelCase(str)
  }
}

type StringMapper = (str: string) => string

class SnakeCaseTransformer extends OperationNodeTransformer {
  readonly #snakeCase: StringMapper

  constructor(snakeCase: StringMapper) {
    super()
    this.#snakeCase = snakeCase
  }

  protected override transformIdentifier(node: IdentifierNode): IdentifierNode {
    node = super.transformIdentifier(node)

    return {
      ...node,
      identifier: this.#snakeCase(node.identifier),
    }
  }
}

function canMap(obj: any): obj is Record<string, any> {
  return isObject(obj) && !(obj instanceof Date) && !Buffer.isBuffer(obj)
}

function createSnakeCase({
  upperCase = false,
  underscoreBeforeDigits = false,
  underscoreBetweenUppercaseLetters = false,
} = {}): StringMapper {
  return memoize((str: string): string => {
    if (str.length === 0) {
      return str
    }

    const upper = str.toUpperCase()
    const lower = str.toLowerCase()

    let out = lower[0]

    for (let i = 1, l = str.length; i < l; ++i) {
      const char = str[i]
      const prevChar = str[i - 1]

      const upperChar = upper[i]
      const prevUpperChar = upper[i - 1]

      const lowerChar = lower[i]
      const prevLowerChar = lower[i - 1]

      // If underScoreBeforeDigits is true then, well, insert an underscore
      // before digits :). Only the first digit gets an underscore if
      // there are multiple.
      if (underscoreBeforeDigits && isDigit(char) && !isDigit(prevChar)) {
        out += '_' + char
        continue
      }

      // Test if `char` is an upper-case character and that the character
      // actually has different upper and lower case versions.
      if (char === upperChar && upperChar !== lowerChar) {
        const prevCharacterIsUppercase =
          prevChar === prevUpperChar && prevUpperChar !== prevLowerChar

        // If underscoreBetweenUppercaseLetters is true, we always place an underscore
        // before consecutive uppercase letters (e.g. "fooBAR" becomes "foo_b_a_r").
        // Otherwise, we don't (e.g. "fooBAR" becomes "foo_bar").
        if (underscoreBetweenUppercaseLetters || !prevCharacterIsUppercase) {
          out += '_' + lowerChar
        } else {
          out += lowerChar
        }
      } else {
        out += char
      }
    }

    if (upperCase) {
      return out.toUpperCase()
    } else {
      return out
    }
  })
}

function createCamelCase({ upperCase = false } = {}): StringMapper {
  return memoize((str: string): string => {
    if (str.length === 0) {
      return str
    }

    if (upperCase && isAllUpperCaseSnakeCase(str)) {
      // Only convert to lower case if the string is all upper
      // case snake_case. This allows camelCase strings to go
      // through without changing.
      str = str.toLowerCase()
    }

    let out = str[0]

    for (let i = 1, l = str.length; i < l; ++i) {
      const char = str[i]
      const prevChar = str[i - 1]

      if (char !== '_') {
        if (prevChar === '_') {
          out += char.toUpperCase()
        } else {
          out += char
        }
      }
    }

    return out
  })
}

function isAllUpperCaseSnakeCase(str: string): boolean {
  for (let i = 1, l = str.length; i < l; ++i) {
    const char = str[i]

    if (char !== '_' && char !== char.toUpperCase()) {
      return false
    }
  }

  return true
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

function memoize(func: StringMapper): StringMapper {
  const cache = new Map<string, string>()

  return (str: string) => {
    let mapped = cache.get(str)

    if (!mapped) {
      mapped = func(str)
      cache.set(str, mapped)
    }

    return mapped
  }
}

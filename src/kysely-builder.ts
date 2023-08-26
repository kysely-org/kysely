import { Database, DefaultTypeConfig, TypeConfig } from './database.js'
import { Dialect, TypeConfigProp } from './dialect/dialect.js'
import { Kysely, KyselyConfig } from './kysely.js'
import { KyselyPlugin } from './plugin/kysely-plugin.js'
import { LogConfig } from './util/log.js'
import { freeze } from './util/object-utils.js'

interface InitialKyselyBuilder<TBL extends object> {
  dialect<D extends Dialect>(
    dialect: D
  ): KyselyBuilder<{
    tables: TBL
    config: PickConfigFromDialect<D>
  }>
}

interface KyselyBuilder<DB extends Database> {
  log(logConfig?: LogConfig): KyselyBuilder<DB>
  plugins(plugins?: KyselyPlugin[]): KyselyBuilder<DB>
  build(): Kysely<DB>
}

type PickConfigFromDialect<
  D extends Dialect,
  TC = TypeConfigProp extends keyof D
    ? Exclude<D[TypeConfigProp], undefined>
    : DefaultTypeConfig
> = TC extends TypeConfig
  ? TC
  : {
      [K in keyof TypeConfig]: K extends keyof TC ? TC[K] : DefaultTypeConfig[K]
    }

class InitialKyselyBuilderImpl<TBL extends object>
  implements InitialKyselyBuilder<TBL>
{
  dialect<D extends Dialect>(
    dialect: D
  ): KyselyBuilder<{
    tables: TBL
    config: PickConfigFromDialect<D>
  }> {
    return new KyselyBuilderImpl({ dialect })
  }
}

class KyselyBuilderImpl<DB extends Database> implements KyselyBuilder<DB> {
  readonly #config: KyselyConfig

  constructor(props: KyselyConfig) {
    this.#config = freeze(props)
  }

  log(logConfig: LogConfig): KyselyBuilder<DB> {
    return new KyselyBuilderImpl<DB>({
      ...this.#config,
      log: logConfig,
    })
  }

  plugin(plugins: KyselyPlugin): KyselyBuilder<DB> {
    return new KyselyBuilderImpl<DB>({
      ...this.#config,
      plugins: this.#config.plugins
        ? [...this.#config.plugins, plugins]
        : [plugins],
    })
  }

  plugins(plugins: KyselyPlugin[]): KyselyBuilder<DB> {
    return new KyselyBuilderImpl<DB>({
      ...this.#config,
      plugins: this.#config.plugins
        ? [...this.#config.plugins, ...plugins]
        : [...plugins],
    })
  }

  build(): Kysely<DB> {
    return new Kysely(this.#config)
  }
}

export function kysely<Tables extends object>(): InitialKyselyBuilder<Tables> {
  return new InitialKyselyBuilderImpl<Tables>()
}

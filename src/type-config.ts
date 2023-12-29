declare global {
  /**
   * The interface users can extend using interface merging:
   *
   * ```ts
   * declare global {
   *   interface KyselyTypeConfig {
   *     bigIntType: number
   *   }
   * }
   * ```
   *
   * See {@link DefaultKyselyTypeConfig} for configs that can be
   * overridden.
   */
  interface KyselyTypeConfig {}
}

interface DefaultKyselyTypeConfig {
  dateTimeType: Date | string
  floatType: number | string
  bigIntType: bigint | number | string

  /**
   * This type can be used to specify the `sum` function's output type.
   */
  sumType: number | string | bigint

  /**
   * This type can be used to specify the `avg` function's output type.
   * By default the {@link floatType} is used.
   */
  avgType: never

  /**
   * This type can be used to specify the `count` and `countAll` functions' output type.
   * By default the {@link bigIntType} is used.
   */
  countType: never
}

export type GetConfig<K extends keyof DefaultKyselyTypeConfig> =
  K extends keyof KyselyTypeConfig
    ? KyselyTypeConfig[K]
    : DefaultKyselyTypeConfig[K]

export type GetConfigFallback<
  K extends keyof DefaultKyselyTypeConfig,
  F extends keyof DefaultKyselyTypeConfig
> = GetConfig<K> extends never ? GetConfig<F> : GetConfig<K>

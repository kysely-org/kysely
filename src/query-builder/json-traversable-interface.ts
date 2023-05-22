export interface JSONTraversable<S, O> {
  /**
   * TODO: ...
   */
  at<I extends any[] extends O ? keyof NonNullable<O> & number : never>(
    index: I
  ): JSONTraversable<
    S,
    undefined extends O
      ? null | NonNullable<NonNullable<O>[I]>
      : null extends O
      ? null | NonNullable<NonNullable<O>[I]>
      : NonNullable<O>[I]
  >

  /**
   * TODO: ...
   */
  key<
    K extends any[] extends O
      ? never
      : NonNullable<O> extends object
      ? keyof NonNullable<O> & string
      : never
  >(
    key: K
  ): JSONTraversable<
    S,
    undefined extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : null extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : NonNullable<O>[K]
  >
}

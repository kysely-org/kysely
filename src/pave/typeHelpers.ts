// Type utility to transform keys from snake_case to camelCase
export type CamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<CamelCase<U>>}`
  : S;

export type CamelCasedProperties<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K];
};
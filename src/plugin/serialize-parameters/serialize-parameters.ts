export type Serializer = (parameter: unknown) => unknown

export const defaultSerializer: Serializer = (parameter) => {
  if (parameter && typeof parameter === 'object') {
    return JSON.stringify(parameter)
  }

  return parameter
}

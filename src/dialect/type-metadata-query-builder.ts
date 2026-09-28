import type { TypeMetadata, TypeMetadataKind } from './database-introspector.js'

export interface TypeMetadataProvider {
  getTypes(): Promise<TypeMetadata[]>
}

export class TypeMetadataQueryBuilder<
  K extends TypeMetadataKind | undefined = undefined,
> {
  readonly #introspector: TypeMetadataProvider
  readonly #name: string
  readonly #schema?: string
  readonly #kind?: K

  constructor(
    introspector: TypeMetadataProvider,
    name: string,
    schema?: string,
    kind?: K,
  ) {
    this.#introspector = introspector
    this.#name = name
    this.#schema = schema
    this.#kind = kind
  }

  schema(schema: string): TypeMetadataQueryBuilder<K> {
    return new TypeMetadataQueryBuilder(
      this.#introspector,
      this.#name,
      schema,
      this.#kind,
    )
  }

  kind<T extends TypeMetadataKind>(kind: T): TypeMetadataQueryBuilder<T> {
    return new TypeMetadataQueryBuilder(
      this.#introspector,
      this.#name,
      this.#schema,
      kind,
    )
  }

  async execute(): Promise<
    TypeMetadata &
      (K extends 'enum' ? { kind: 'enum'; values: string[] } : unknown)
  > {
    const types = await this.#introspector.getTypes()
    const type = types.find(
      (type) =>
        type.name === this.#name &&
        (this.#schema === undefined || type.schema === this.#schema) &&
        (this.#kind === undefined || type.kind === this.#kind),
    )

    if (!type) {
      const schema = this.#schema ? ` in schema "${this.#schema}"` : ''
      const kind = this.#kind ? ` of kind "${this.#kind}"` : ''
      throw new Error(`type "${this.#name}"${schema}${kind} not found`)
    }

    return type as TypeMetadata &
      (K extends 'enum' ? { kind: 'enum'; values: string[] } : unknown)
  }
}

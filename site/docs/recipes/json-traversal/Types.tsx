import React from 'react'
import { Dialect } from '@site/docs/getting-started/shared'
import CodeBlock from '@theme/CodeBlock'

export interface TypesProps {
  dialect: Dialect
}

export function Types(props: TypesProps) {
  return (
    <>
      <p>
        When defining a JSON column's type, it must follow the following rules:
        <br />
        <br />
        <strong>Root column type</strong> - The root select type must be of
        object or array type. It can be nullable, but cannot be optional (
        <code>jsonColumn?:</code>), just like any other column type definition.
        Its insert and update types must be strings, as you'd{' '}
        <code>JSON.stringify</code> JSON parameters.
        <br />
        <br />
        <strong>Nested field type</strong> - Nested fields must have a JSON
        native type (string, number, boolean, null, object or array). Unlike the
        root column, nested fields can be optional (<code>field?:</code>).
        <br />
        <br />
        <strong>
          Unknowns, JSON (Discriminated) Unions and other complexities
        </strong>{' '}
        - Supporting traversal to not-well-defined JSONs or complex types was
        not part of phase 1. It could work right now, but we haven't tested it.
        We'd appreciate any feedback or real-world examples, as we prepare for
        the next phases.
        <br />
        <hr />
      </p>
      <CodeBlock language="ts" title="src/types.ts">
        {`import { ColumnType, Generated, JSONColumnType } from 'kysely'
        
export interface Database {
  person_metadata: PersonMetadataTable
}

export interface PersonMetadataTable {
  profile: JSONColumnType<{ created_at: string }> // short for ColumnType<T, string, string>
}`}
      </CodeBlock>
    </>
  )
}

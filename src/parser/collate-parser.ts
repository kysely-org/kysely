export type Collation =
  // anything super common or simple should be added here.
  // https://sqlite.org/datatype3.html#collating_sequences
  | 'nocase'
  | 'binary'
  | 'rtrim'
  // otherwise, allow any string, while still providing autocompletion.
  | (string & {})

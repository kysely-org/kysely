import type { PrismTheme } from 'prism-react-renderer'

/**
 * VS Code Dark+ / Light+ palettes mapped onto Prism token types, so docs
 * code blocks match the landing page figures (highlighted with shiki's
 * `dark-plus` / `light-plus` themes) and the hero demo video.
 *
 * Color sources: shiki's `dark-plus` / `light-plus` theme JSON. Prism
 * cannot tell control-flow keywords or object keys apart from regular
 * keywords and identifiers, so those keep the base keyword and variable
 * colors.
 *
 * Prism leaves TypeScript identifiers untokenized, so `plain` carries the
 * VS Code variable color in dark mode (#9cdcfe), matching how kysely
 * queries render in the editor. Punctuation and operators are tokenized
 * and pull those back to the editor foreground (#d4d4d4).
 */

export const darkPlus = {
  plain: {
    backgroundColor: '#1e1e1e',
    color: '#9cdcfe',
  },
  styles: [
    {
      style: { color: '#6a9955' },
      types: ['comment', 'prolog', 'cdata'],
    },
    {
      style: { color: '#569cd6' },
      types: ['keyword', 'boolean', 'tag', 'changed'],
    },
    {
      style: { color: '#ce9178' },
      types: ['string', 'char', 'attr-value', 'template-string', 'deleted'],
    },
    {
      style: { color: '#b5cea8' },
      types: ['number', 'inserted'],
    },
    {
      style: { color: '#dcdcaa' },
      types: ['function'],
    },
    {
      style: { color: '#4ec9b0' },
      types: ['class-name', 'builtin', 'maybe-class-name', 'namespace'],
    },
    {
      style: { color: '#4fc1ff' },
      types: ['constant'],
    },
    {
      style: { color: '#9cdcfe' },
      types: ['variable', 'attr-name', 'property', 'literal-property'],
    },
    {
      style: { color: '#d4d4d4' },
      types: ['operator', 'punctuation'],
    },
    {
      style: { color: '#d16969' },
      types: ['regex'],
    },
    {
      style: { color: '#d7ba7d' },
      types: ['selector'],
    },
  ],
} satisfies PrismTheme

export const lightPlus = {
  plain: {
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  styles: [
    {
      style: { color: '#008000' },
      types: ['comment', 'prolog', 'cdata'],
    },
    {
      style: { color: '#0000ff' },
      types: ['keyword', 'boolean'],
    },
    {
      style: { color: '#a31515' },
      types: ['string', 'char', 'attr-value', 'template-string', 'deleted'],
    },
    {
      style: { color: '#098658' },
      types: ['number', 'inserted'],
    },
    {
      style: { color: '#795e26' },
      types: ['function'],
    },
    {
      style: { color: '#267f99' },
      types: ['class-name', 'builtin', 'maybe-class-name', 'namespace'],
    },
    {
      style: { color: '#0070c1' },
      types: ['constant'],
    },
    {
      style: { color: '#001080' },
      types: ['variable', 'literal-property'],
    },
    {
      style: { color: '#0451a5' },
      types: ['property', 'changed'],
    },
    {
      style: { color: '#e50000' },
      types: ['attr-name'],
    },
    {
      style: { color: '#800000' },
      types: ['tag', 'selector'],
    },
    {
      style: { color: '#000000' },
      types: ['operator', 'punctuation'],
    },
    {
      style: { color: '#811f3f' },
      types: ['regex'],
    },
  ],
} satisfies PrismTheme

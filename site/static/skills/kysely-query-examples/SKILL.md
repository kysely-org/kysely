---
name: kysely-query-examples
description: Find Kysely usage examples in the installed package's JSDoc comments, official recipes, and real-world GitHub repositories linked from the homepage.
---

# Kysely query examples

Kysely ships API explanations and code examples in its JSDoc comments. These
examples are type-checked in Kysely's CI and pinned to the installed version
when read from the project's resolved package.
Locate the Kysely package resolved by the project using its package manager or
module resolver; `node_modules/kysely` is only one possible location. Read the
relevant API's JSDoc in the package's `.d.ts` files under `dist/`. Follow imports
and re-exports as needed.

For guides to common patterns, read the [recipes index](https://kysely.dev/docs/category/recipes.md)
and follow its links to the relevant Markdown recipes.

For real-world examples, read the [homepage Markdown](https://kysely.dev/index.md).
Follow GitHub code links in its "In production at" and "Built into" proof wall
to explore how projects use Kysely. Check examples against the installed
version's JSDoc before adapting them.

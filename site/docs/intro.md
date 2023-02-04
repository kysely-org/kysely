---
sidebar_position: 1
---

# Introduction

Kysely (pronounce “Key-Seh-Lee”) is a type-safe and autocompletion-friendly typescript SQL query builder. Inspired by knex. Mainly developed for node.js but also runs on deno and in the browser.

![image](https://github.com/koskimas/kysely/raw/master/assets/demo.gif)

Kysely makes sure you only refer to tables and columns that are visible to the part of the query you're writing. The result type only has the selected columns with correct types and aliases. As an added bonus you get autocompletion for all that stuff.

As shown above, through the magic of typescript, Kysely is able to parse the alias given to `pet.name` and add the `pet_name` column to the result row type. Kysely is able to infer column names, aliases and types from selected subqueries, joined subqueries, `with` statements and pretty much anything you can think of.

Of course there are cases where things cannot be typed at compile time, and Kysely offers escape hatches for these situations. See the sql template tag and the `DynamicModule` for more info.

All API documentation is written in the typing files and you can simply cmd-click on the module, class or method you're using to see it. The same documentation is also hosted here.

## Looking for help?

If you start using Kysely and can't find something you'd want to use, please [open an issue](https://github.com/koskimas/kysely/issues) or [join our discord server](https://discord.gg/xyBJ3GwvAm).

You can find a more thorough introduction here.

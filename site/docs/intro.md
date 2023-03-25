---
sidebar_position: 1
---

# Introduction

Kysely (pronounced “Key-Seh-Lee”) is a type-safe and autocompletion-friendly TypeScript SQL query builder. Inspired by Knex. Mainly developed for Node.js but also runs on Deno and in the browser.

![image](https://github.com/koskimas/kysely/raw/master/assets/demo.gif)

Kysely makes sure you only refer to tables and columns that are visible to the part of the query you're writing. The result type only has the selected columns with correct types and aliases. As an added bonus you get autocompletion for all that stuff.

As shown above, through the magic of TypeScript, Kysely is able to parse the alias given to `pet.name` and add the `pet_name` column to the result row type. Kysely is able to infer column names, aliases and types from selected subqueries, joined subqueries, `with` statements and pretty much anything you can think of.

Of course there are cases where things cannot be typed at compile time, and Kysely offers escape hatches for these situations. See the sql template tag and the [DynamicModule](https://koskimas.github.io/kysely/classes/DynamicModule.html) for more info.

All API documentation is written in the typing files and you can simply cmd-click on the module, class or method you're using to see it. The same documentation is also hosted [here](https://koskimas.github.io/kysely).

## Looking for help?

If you start using Kysely and can't find something you'd want to use, please [open an issue](https://github.com/koskimas/kysely/issues) or [join our discord server](https://discord.gg/xyBJ3GwvAm).

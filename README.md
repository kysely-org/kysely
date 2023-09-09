[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://stand-with-ukraine.pp.ua)

[![Discord](https://img.shields.io/discord/890118421587578920?logo=discord&style=flat)](https://discord.gg/xyBJ3GwvAm)
[![Tests](https://github.com/kysely-org/kysely/actions/workflows/test.yml/badge.svg)](https://github.com/kysely-org/kysely)
[![License](https://img.shields.io/github/license/kysely-org/kysely?style=flat)](https://github.com/kysely-org/kysely/blob/master/LICENSE)
[![Issues](https://img.shields.io/github/issues-closed/kysely-org/kysely?logo=github)](https://github.com/kysely-org/kysely/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)
[![Pull Requests](https://img.shields.io/github/issues-pr-closed/kysely-org/kysely?label=PRs&logo=github&style=flat)](https://github.com/kysely-org/kysely/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/kysely-org/kysely?style=flat&logo=snyk)](https://snyk.io/advisor/npm-package/kysely)
[![Downloads](https://img.shields.io/npm/dw/kysely?logo=npm)](https://www.npmjs.com/package/kysely)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/kysely?label=size&logo=npm)](https://bundlephobia.com/package/kysely)
[![Social](https://img.shields.io/twitter/follow/kysely_?style=social)](https://twitter.com/kysely_)

# [Kysely](https://kysely.dev)

Kysely (pronounce “Key-Seh-Lee”) is a type-safe and autocompletion-friendly typescript SQL query builder.
Inspired by [knex](http://knexjs.org/). Mainly developed for [node.js](https://nodejs.org/en/) but also 
runs on all other javascript environments like [deno](https://deno.land/).

![](https://github.com/kysely-org/kysely/blob/master/assets/demo.gif)

Kysely makes sure you only refer to tables and columns that are visible to the part of the query
you're writing. The result type only has the selected columns with correct types and aliases. As an
added bonus you get autocompletion for all that stuff.

As shown in the gif above, through the pure magic of modern typescript, Kysely is even able to parse
the alias given to `pet.name` and add the `pet_name` column to the result row type. Kysely is able to infer
column names, aliases and types from selected subqueries, joined subqueries, `with` statements and pretty
much anything you can think of.

Of course there are cases where things cannot be typed at compile time, and Kysely offers escape
hatches for these situations. See the [sql template tag](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html)
and the [DynamicModule](https://kysely-org.github.io/kysely-apidoc/classes/DynamicModule.html#ref) for more info.

All API documentation is written in the typing files and you can simply hover over the module, class
or method you're using to see it in your IDE. The same documentation is also hosted [here](https://github.com/kysely-org/kysely).

If you start using Kysely and can't find something you'd want to use, please open an issue or join our
[discord server](https://discord.gg/xyBJ3GwvAm).

# Getting started

Please visit our documentation site [kysely.dev](https://kysely.dev) to get started. We also have a comprehensive
API documentation hosted [here](https://kysely-org.github.io/kysely-apidoc/) but you can access the same
documentation in your IDE by hovering over a class/method/property/whatever.

# Contributors

<p align="center">
    <a href="https://github.com/kysely-org/kysely/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=kysely-org/kysely" />
    </a>
    </br>
    <span>Want to contribute? Check out our <a href="./CONTRIBUTING.md" >contribution guidelines</a>.</span>
</p>

<p align="center">
    <a href="https://vercel.com/?utm_source=kysely&utm_campaign=oss">
        <img src="https://kysely.dev/img/powered-by-vercel.svg" alt="Powered by Vercel" />
    </a>
</p>

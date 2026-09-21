[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://stand-with-ukraine.pp.ua)

# [Kysely](https://kysely.dev)

Kysely (pronounced “Key-Seh-Lee”) is a type-safe TypeScript SQL query builder, inspired by [Knex](https://knexjs.org).
Write queries with autocompletion and inferred result types while keeping control of the SQL you run.

**[Getting started](https://kysely.dev/docs/getting-started) · [Playground](https://play.kysely.dev) · [API reference](https://kysely-org.github.io/kysely-apidoc/)**

[![NPM Version](https://img.shields.io/npm/v/kysely?style=flat&label=latest)](https://github.com/kysely-org/kysely/releases/latest)
[![Socket Badge](https://badge.socket.dev/npm/package/kysely/0.29.6)](https://socket.dev/npm/package/kysely/overview/0.29.6)
[![Tests](https://github.com/kysely-org/kysely/actions/workflows/test.yml/badge.svg)](https://github.com/kysely-org/kysely)
[![License](https://img.shields.io/github/license/kysely-org/kysely?style=flat)](https://github.com/kysely-org/kysely/blob/master/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dw/kysely?logo=npm)](https://www.npmjs.com/package/kysely)
[![JSR Downloads](https://jsr.io/badges/@kysely/kysely/weekly-downloads)](https://jsr.io/@kysely/kysely)

## SQL, with TypeScript

With a [configured `Kysely<Database>` instance](https://kysely.dev/docs/getting-started) named `db`, select people aged 18 and older and their pets:

```ts
const people = await db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.id', 'person.first_name', 'pet.name as pet_name'])
  .where('person.age', '>=', 18)
  .orderBy('person.first_name')
  .execute()
```

TypeScript infers the result from your database types and selected columns, including the `pet_name` alias:

```ts
type Result = typeof people
// { id: number; first_name: string; pet_name: string }[]
```

The generated SQL (PostgreSQL), with `18` passed separately as a parameter:

```sql
select "person"."id", "person"."first_name", "pet"."name" as "pet_name"
from "person"
inner join "pet" on "pet"."owner_id" = "person"."id"
where "person"."age" >= $1
order by "person"."first_name"
```

**[Try this example in the playground][query-playground].**

<details>
<summary>Database types used in this example</summary>

```ts
import type { Generated } from 'kysely'

export interface Database {
  person: {
    id: Generated<number>
    first_name: string
    age: number | null
  }
  pet: {
    id: Generated<number>
    name: string
    owner_id: number
  }
}
```

These types describe your database; they don't create its tables. You can [generate them from an existing database](https://kysely.dev/docs/generating-types) or write them yourself.

</details>

## Why Kysely?

- **SQL you already know.** Build queries with joins, subqueries, common table expressions and other familiar SQL constructs. [Explore the examples](https://kysely.dev/docs/category/examples).
- **Types that follow your query.** Get autocompletion for tables and columns in scope, and result types that reflect your selections and aliases. API documentation and examples are available right in your IDE.
- **Queries you can compose.** Build [reusable expressions and helpers](https://kysely.dev/docs/recipes/reusable-helpers), add [conditional filters](https://kysely.dev/docs/examples/where/conditional-where-calls), or use the [parameterized `sql` template tag](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html) when you need custom SQL.
- **Fits your stack.** Kysely has zero runtime dependencies. Choose a [dialect and driver](https://kysely.dev/docs/dialects) for your database and JavaScript runtime, including Node.js, Bun, Deno, Cloudflare Workers and browsers.

![Kysely providing table and column autocompletion and inferring query result types in an editor](https://github.com/kysely-org/kysely/blob/master/assets/demo.gif)

## Getting started

Install Kysely, then follow the guide for your database to choose a driver and configure your first query:

```sh
npm install kysely
```

**[PostgreSQL](https://kysely.dev/docs/getting-started?dialect=postgresql) · [MySQL](https://kysely.dev/docs/getting-started?dialect=mysql) · [SQL Server](https://kysely.dev/docs/getting-started?dialect=mssql) · [SQLite](https://kysely.dev/docs/getting-started?dialect=sqlite) · [PGlite](https://kysely.dev/docs/getting-started?dialect=pglite)**

See [all dialects](https://kysely.dev/docs/dialects) for community integrations.
The docs also cover [generating database types](https://kysely.dev/docs/generating-types), [migrations](https://kysely.dev/docs/migrations) and [plugins](https://kysely.dev/docs/plugins).

## Who uses Kysely?

Kysely runs in production at [Mozilla](https://github.com/mozilla/fxa/blob/8c812edefcc860e3a889f7f3e9b14a926ab056cb/libs/accounts/passkey/src/lib/passkey.repository.ts), [Bluesky](https://github.com/bluesky-social/atproto/blob/f5a0af4465b469203a2a0804e9611474fde50feb/packages/ozone/src/set/service.ts) and [Materialize](https://github.com/MaterializeInc/materialize/blob/3a708836669f15a6dcb700b118fc01e1db7f2db8/console/src/api/materialize/roles/roleDetails.ts).
It's also built into tools including [Better Auth](https://github.com/better-auth/better-auth/blob/86faaee69b6c2afe237fff8a00602ecc8eccc367/packages/better-auth/src/db/get-migration.ts), [MikroORM](https://github.com/mikro-orm/mikro-orm/blob/80959d2aaa20862b76c37ad9fc3a6be79fb9ba74/packages/sql/package.json) and [Prisma Studio](https://github.com/prisma/studio/blob/550f51d2b1cdf4487a6abfb3278df8c3a51aeb2b/data/mysql-core/dml.ts).
Each name links to public evidence; see more projects on [kysely.dev](https://kysely.dev).

## Community

Ask questions and share what you're building on [Discord](https://discord.gg/xyBJ3GwvAm), follow updates on [Bluesky](https://bsky.app/profile/kysely.dev), or [report a bug](https://github.com/kysely-org/kysely/issues).
Contributions are welcome! Read the [contribution guidelines](./CONTRIBUTING.md) to get started.

[query-playground]: https://play.kysely.dev/#r%7B%22dialect%22%3A%22postgres%22%2C%22editors%22%3A%7B%22query%22%3A%22const%20people%20%3D%20await%20db%5Cn%20%20.selectFrom('person')%5Cn%20%20.innerJoin('pet'%2C%20'pet.owner_id'%2C%20'person.id')%5Cn%20%20.select(%5B'person.id'%2C%20'person.first_name'%2C%20'pet.name%20as%20pet_name'%5D)%5Cn%20%20.where('person.age'%2C%20'%3E%3D'%2C%2018)%5Cn%20%20.orderBy('person.first_name')%5Cn%20%20.execute()%22%2C%22type%22%3A%22import%20type%20%7B%20Generated%20%7D%20from%20'kysely'%5Cn%5Cnexport%20interface%20Database%20%7B%5Cn%20%20person%3A%20%7B%5Cn%20%20%20%20id%3A%20Generated%3Cnumber%3E%5Cn%20%20%20%20first_name%3A%20string%5Cn%20%20%20%20age%3A%20number%20%7C%20null%5Cn%20%20%7D%5Cn%20%20pet%3A%20%7B%5Cn%20%20%20%20id%3A%20Generated%3Cnumber%3E%5Cn%20%20%20%20name%3A%20string%5Cn%20%20%20%20owner_id%3A%20number%5Cn%20%20%7D%5Cn%7D%5Cn%5Cnimport%20type%20%7B%20Kysely%20%7D%20from%20'kysely'%5Cn%5Cndeclare%20global%20%7B%5Cn%20%20const%20db%3A%20Kysely%3CDatabase%3E%5Cn%7D%5Cn%22%7D%2C%22hideType%22%3Atrue%7D

## Core team

### Project leads

Responsible for project direction, API design, maintenance, code reviews, community support, documentation, and working on some of the most 
impactful/challenging things.

<table>
    <tbody>
        <tr>
            <td align="center">
                <a href="https://github.com/koskimas">
                    <img src="https://avatars.githubusercontent.com/u/846508?v=4?s=100" width="100px;" alt=""/>
                    <br />
                    Sami Koskimäki
                </a>
                <br />
                (the <a href="https://web.archive.org/web/20211203210043/https://www.jakso.me/blog/kysely-a-type-safe-sql-query-builder-for-typescript">author</a>)
            </td>
            <td align="center">
                <a href="https://github.com/igalklebanov">
                    <img src="https://avatars.githubusercontent.com/u/14938291?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Igal Klebanov
                </a>
                <br />
                (the <a href="https://github.com/kysely-org/kysely/pull/1414#issuecomment-2781281996">dynamo</a>)
            </td>
        </tr>
    </tbody>
</table>

### Honorable mentions

People who had special impact on the project and its growth.

<table>
    <tbody>
        <tr>
            <td align="center">
                <a href="https://github.com/fhur">
                    <img src="https://avatars.githubusercontent.com/u/6452323?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Fernando Hurtado
                </a>
                <br />
                (1st <a href="https://kysely.dev">docs</a>)
            </td>
            <td align="center">
                <a href="https://github.com/wirekang">
                    <img src="https://avatars.githubusercontent.com/u/43294688?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Wirekang
                </a>
                <br />
                (<a href="https://kyse.link">playground</a>)
            </td>
            <td align="center">
                <a href="https://github.com/tgriesser">
                    <img src="https://avatars.githubusercontent.com/u/154748?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Tim Griesser
                </a>
                <br />
                (<a href="https://knexjs.org/">Knex</a>)
            </td>
        </tr>
        <tr>
            <td align="center">
                <a href="https://github.com/RobinBlomberg">
                    <img src="https://avatars.githubusercontent.com/u/20827397?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Robin Blomberg
                </a>
                <br />
                (<a href="https://github.com/RobinBlomberg/kysely-codegen">codegen</a>)
            </td>
                        <td align="center">
                <a href="https://github.com/nexxeln">
                    <img src="https://avatars.githubusercontent.com/u/95541290?v=4&s=100" width="100px" alt="" />
                    <br />
                    Shoubhit Dash
                </a>
                <br />
                (prisma <a href="https://www.nexxel.dev/blog/typesafe-database">idea</a>)
            </td>
            <td align="center">
                <a href="https://github.com/valtyr">
                    <img src="https://avatars.githubusercontent.com/u/3050355?v=4&s=100" width="100px" alt="" />
                    <br />
                    Valtýr Örn Kjartansson
                </a>
                <br />
                (prisma <a href="https://github.com/valtyr/prisma-kysely">impl</a>)
            </td>
        </tr>
        <tr>
            <td align="center">
                <a href="https://github.com/thdxr">
                    <img src="https://avatars.githubusercontent.com/u/826656?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Dax Raad
                </a>
                <br />
                (early <a href="https://thdxr.com/post/serverless-relational-showdown">adopter</a>)
            </td>
            <td align="center">
                <a href="https://github.com/t3dotgg">
                    <img src="https://avatars.githubusercontent.com/u/6751787?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Theo Browne
                </a>
                <br />
                (early <a href="https://discord.com/channels/966627436387266600/988912020558602331/993220628154961930">promoter</a>)
            </td>
            <td align="center">
                <a href="https://github.com/leerob">
                    <img src="https://avatars.githubusercontent.com/u/9113740?v=4&s=100" width="100px;" alt="" />
                    <br />
                    Lee Robinson
                </a>
                <br />
                (early <a href="https://x.com/leerob/status/1576929372811849730">promoter</a>)
            </td>
        </tr>
        <tr>
            <td align="center">
                <a href="https://github.com/ethanresnick">
                    <img src="https://avatars.githubusercontent.com/u/471894?v=4&s=100" width="100px" alt="" />
                    <br />
                    Ethan Resnick
                </a>
                <br />
                (timely <a href="https://github.com/kysely-org/kysely/issues/494">feedback</a>)
            </td>
            <td align="center">
                <a href="https://github.com/thetutlage">
                    <img src="https://avatars.githubusercontent.com/u/1706381?v=4&s=100" width="100px;" alt="" />
                    <br />
                    Harminder Virk
                </a>
                <br />
                (dope <a href="https://github.com/thetutlage/meta/discussions/8">writeup</a>)
            </td>
            <td align="center">
                <a href="https://github.com/elitan">
                    <img src="https://avatars.githubusercontent.com/u/331818?v=4&s=100" width="100px;" alt="" />
                    <br />
                    Johan Eliasson
                </a>
                <br />
                (<a href="https://eliasson.me/articles/crafting-the-perfect-t3-stack-my-journey-with-kysely-atlas-and-clerk">promoter</a>/<a href="https://www.youtube.com/watch?v=u2s39dRIpCM">educator</a>)
            </td>
        </tr>
        <!-- <tr>
            <td align="center">
                <a href="">
                    <img src="" width="100px;" alt="" />
                    <br />
                    Name
                </a>
                <br />
                (contribution)
            </td>
        </tr> -->
    </tbody>
</table>

### All contributors

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

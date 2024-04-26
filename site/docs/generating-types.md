# Generating types

To work with Kysely, you're required to provide a database schema type definition to the Kysely constructor.

In many cases, defining your database schema definitions manually is good enough.

However, when building production applications, it's best to stay aligned with the 
database schema, by automatically generating the database schema type definitions.

There are several ways to do this using third-party libraries:

- [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen) - This library 
generates Kysely database schema type definitions by connecting to and introspecting 
your database. This library works with all built-in dialects.

- [prisma-kysely](https://github.com/valtyr/prisma-kysely) - This library generates 
Kysely database schema type definitions from your existing Prisma schemas.

- [kanel-kysely](https://github.com/kristiandupont/kanel/tree/main/packages/kanel-kysely) - This
library generates Kysely database schema type definitions by connecting to and introspecting 
your database. This library extends Kanel which is a mature PostgreSQL-only type generator.

- [kysely-schema-generator](https://github.com/deanc/kysely-schema-generator) - This library 
generates Kysely database schema type definitions by connecting to and introspecting 
your database. Current MySQL only.

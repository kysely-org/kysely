# Working with schemas

First of all, when we talk about schemas in this document, we mean custom
schemas like [postgres schemas](https://www.postgresql.org/docs/14/ddl-schemas.html).

There are two common ways to use schemas:

1. To group a logical set of tables under the same "namespace". For example
   all tables directly related to users could live under a `user` schema.

2. To have a separate namespaced copy of a set of tables for each
   tenant in a multitenant application.

Kysely offers tools for both of these cases.

## 1

When you have an enumarable set of schemas, you can add them to your database interface
like this:

```ts
interface Database {
  'user.user': UserTable
  'user.user_permission': UserPermissionTable
  'user.permission': PermissionTable
  pet: PetTable
}
```

then you can refer to the tables just like you would a normal table:

```ts
db.selectFrom('user.user')
  .where('username', '=', '')
  // You can also include the full table name
  .where('user.user.created_at', '>', createdAt)
  .innerJoin('user.user_permission as up', 'up.user_id', 'user.user.id')
  .innerJoin('user.permission as p', 'p.id', 'up.permission_id')
  .selectAll()
```

## 2

In the multitenant case you have a schema per tenant and you can't add each of them to the
database interface, nor would it make sense to do so. In this case you can use the
[withSchema](https://kysely-org.github.io/kysely-apidoc/classes/Kysely.html#withSchema) method.

The `withSchema` method sets the default schema of all table references that don't explicitly
specify a schema:

```ts
db.withSchema(tenant)
  .selectFrom('user')
  .innerJoin('user_permission as up', 'up.user_id', 'user.id')
  .innerJoin('public.permission as p', 'p.id', 'up.permission_id')
  .selectAll()
```

This is the generated SQL assuming `tenant` equals `'acme'`:

```sql
select * from "acme"."user"
inner join "acme"."user_permission" as "up" on "up"."user_id" = "acme"."user"."id"
inner join "public"."permission" as "p" on "p"."id" = "up"."permission_id"
```

In this example we also referred to a shared table `permission` in the `public` schema.
Please note that you need to add a `'public.permission': PermissionTable` item in your
database schema to be able to refer to the `public.permission` table:

```ts
interface Database {
  // Add your tenant tables without any schema:
  user: UserTable
  user_permission: UserPermissionTable

  // Add schemas and tables you need to explicitly reference like this:
  'public.permission': PermissionTable

  // You can also have other shared tables with or without schemas here.
  // But keep in mind that if you want to refer to them from a `withSchema`
  // query, you need the table name with the schema name.
  pet: PetTable
}
```

See the [first case](#1) for more info.

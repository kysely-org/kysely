# An example server that uses Kysely

This is a simple but realistic Koa based server that shows one way to use Kysely. Since this example attempts to mimic a real world project, most of the code isn't relevant to learning how to use Kysely. The relevant parts are the repositories and how they are used. This examples is by no means the best or the right way to use Kysely, but simply one possible way.

The server has three main levels of abstraction:

1. **Repository**: Repositories contain all Kysely code and provide higher level methods for dealing with the database.

2. **Service**: All business logic is implemented in the service layer. Services use repositories to interact with the database. While repositories deal with database rows and types like `UserRow` the service layer doesn't leak out those types. For example user service methods return and take `User` objects instead of `UserRow` objects.

3. **Controller**: Controllers define the HTTP API. Controllers validate and convert the inputs and outputs from/to the network and call services to carry out the actual business logic.

## Running the example

All you need to do start poking around with the code is to clone kysely, go to the example folder and run:

```
npm install
npm test
```

You need to have postgres running in the default port `5432` and the default postgres user `postgres` should exist with no password. You can modify the [test configuration](https://github.com/koskimas/kysely/blob/master/example/test/test-config.ts) if you want to use different settings.

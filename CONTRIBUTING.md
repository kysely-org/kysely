Would love to contribute to Kysely?

Awesome! We are not very organized yet. We don't have a plan or a roadmap.

Probably the best way to get going is to watch the issue list.
An issue with a `greenlit` label, has been acknowledged by the team and is ready for development.
Find such an issue you'd like to tackle and ask to be assigned to it in the comment section.
Feel free to open an issue if you found a bug or a missing feature you'd like to work on,
and there aren't any issues mentioning it.

If you start working on something larger, it's a good idea to create a draft (WIP) PR at 
an early stage so that we can guide you to the right direction.

There are quite a few guidelines to keep in mind:

* Kysely should have zero dependencies.

* Kysely should work in all javascript environments (node.js, deno & modern browsers), 
even though the main focus is node.js.

* Everything is immutable.

* The API should be as close to writing raw SQL as possible while still providing 
type safety.

* Everything outside of dialect implementations is dialect-agnostic.

* Everything is tested.

    * Functionality - No mocks. Everything is tested against real database instances.
    No partial testing. If a sql "thing" is supported by some databases, test it
    against all of them.

    * Types - We're a type-safe package, you get the idea.

* Everything consumer-facing should be documented.

* Everything is type-safe. Things that cannot be implemented in a way that is safe 
for all cases, are best left for consumers to implement.

* Most features should have escape hatches.

# Getting started

1. fork kysely.

2. clone your fork.

3. install node.js (preferable latest LTS).

4. run `npm i` in your terminal to install dev dependencies.

5. create a branch.

6. create a draft pull request. link the relevant issue by refering to it in the 
PR's description. E.g. `closes #123` will link the PR to issue/pull request #123.

7. implement your changes.

# Testing

1. write functionality tests in `test/node`.

2. write typings tests in `test/typings/test-d`

3. install docker.

4. run `docker-compose up` in your terminal to spin up database instances.

5. run `npm test` in your terminal to run tests.
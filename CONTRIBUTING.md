Would love to contribute to Kysely?

Awesome! We are not very organized yet. We don't have a plan or a roadmap.

Probably the best way to get going is to watch the issue list and comment there if you see something you want to work on. 
If you start working on something larger, it's a good idea to create WIP PR at an early stage so that we can guide you to the right direction. 

There's quite a few "rules" to keep in mind:

* Kysely should have zero dependencies.

* Kysely should work in all javascript environments (node.js, deno & modern browsers), even though the main focus is node.js.

* Everything is immutable.

* The API should be as close to writing raw SQL as possible while still providing type safety.

* Everything outside of dialect implementations is dialect-agnostic.

* Everything is tested. 

    * Functionality - No mocks. Everything is tested against real instances.

    * Types - We're a type-safe package, you get the idea.

* Everything consumer-facing should be documented.

* Everything is type-safe. Things that cannot be implemented in a way that is safe for all cases, are best left for consumers to implement.

* Most features should have escape hatches.

# Getting started

1. fork kysely.

2. clone your fork.

3. install node.js (preferably LTS v18.x).

4. run `npm i` in your terminal to install dev dependencies.

5. create a branch.

6. create a draft pull request. if there's an issue related to your changes, link it in description body.

7. implement your changes.

# Testing

1. write functionality tests in `test/node`.

2. write typings tests in `test/typings/test-d`

3. install docker.

4. run `docker-compose up` in your terminal to spin up database instances.

5. run `npm test` in your terminal to run tests.
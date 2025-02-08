# Contribution Guidelines

Wanna contribute to Kysely or other libraries within the [kysely-org](https://github.com/kysely-org) organization?

You're awesome! 🤗

## 😕 How Can I Contribute?

## 📢 By Spreading the Word

If you like what we're building here, please: 

1. Tell your friends, co-workers, family, neighbors, followers, etc.
1. Speak about it in meetups and conferences. (if you need help with the presentation, please ask on Discord!).

There is no company behind this organization and project. We do this in our free time and cannot advertise it
all by ourselves. Companies have dedicated devrel teams doing all that work, other projects might have community
managers or full-time developers with the capacity to also handle social media and meetups with higher frequency.

More people using Kysely eventually means:

1. less bugs left unreported and unsolved.
1. high chance people share workarounds.
1. more data points for innovation.
1. more people who might contribute and push this thing even further.
1. it becomes a standard part of the Node.js/Bun/Deno developer's toolbox so you'll happily stumble upon it
   in future codebases you'll join, or it'll be easier to get buy-in from co-workers/leadership.

## 🤝 By Helping People in Issues or on Discord

We need all the help we can get with supporting the community, answering questions, triaging! 

If you've been using the library for a while, or know a thing or two about SQL, and specific databases, don't 
be shy about it!

## 🐛 By Submitting Issues (Bugs, Enhancement Ideas, Questions) or Opening threads on Discord

Please use search and make sure an existing **open** issue or thread doesn't exist before submitting. If an existing
issue is only somewhat relevant, please submit a new issue and reference the old one instead of commenting
on the existing one. Let us label your new issue as `duplicate` if it is the same thing - it's fine! If it's not 
the same thing and you commented on another issue, it makes it harder to track on our end.

If possible/relevant, please provide a [playground link](https://kyse.link), Stackblitz OR a public git repository that 
reproduces the issue.

Please provide the exact error/warning texts you're getting. "this doesn't work" or "this throws an error"
are not helping us help you.

Don't be an asshole. Don't demand support/service from us.

## ⌨️ With Code!

### 📘 Documentation Code Contributions

Pull requests are always welcome! 

The [kysely.dev](https://kysely.dev) application is located @ [/site](https://github.com/kysely-org/kysely/tree/master/site).

It is a pretty standard [docusaurus](https://docusaurus.io/) application.

The code examples are extracted, using a custom script (see `"script:generate-site-examples"` @ [package.json](https://github.com/kysely-org/kysely/blob/master/package.json)), 
and custom annotations, from [JSDocs](https://jsdoc.app/) comments in the source code @ [/src](https://github.com/kysely-org/kysely/tree/master/src).
If you need to change an existing code example, please do so in the source code AND then run the script.
_TODO: explain how to add a new code example._

If it is a big change (lots of lines of code OR files involved), please get a conversation going on an issue or on 
Discord before starting work on it.

### 🧙 Implementation Code Contributions (Bugfixes, Enhancements [Existing or New Features])

Pull requests (PRs) are welcome, BUT since:

1. Our time and capacity as maintainers are limited.
1. Your time is limited.
1. Your motivation and morale is important to us.
1. Onboarding in a new highly opinionated open-source project can be challenging.

We need a process in place:

1. To make sure only things that have a good chance of being accepted are worked on. We hate saying "no".
1. To make sure that things that are being worked on don't result in too much back-and-forth between authors and maintainers.
   We hate seeing these things drag on for a long time, and we know how frustrating it is on your end.
1. To make sure there's no pressure on you when you take on a task.
1. To make sure there's a clear understanding of who is working on what to avoid redundancies and conflicts.

#### The Process

Here is the gist of it:

1. If an issue on the subject **doesn't exist** yet, **submit** one. If you want to work on it, **ask** to be **assigned**
   to it in the issue **description**, in the **comments**, OR on **Discord**.
1. If an issue on the subject **exists** and is labeled with `bug` OR (`enhancement` AND `greenlit`\* OR even `good first issue`\**):
   1. If there is a pull request (**PR**) **linked** to it:
      1. If the **PR** is **stale** (a few months without new commits or comments from the PR author OR Kysely maintainers),
         **ask** to be **assigned** to it and continue work on the PR.
      1. If the **PR** is **not stale**, you can still offer some review comments, or **ask** to **pair** up with the PR author.
   1. If there is **no PR linked** to it and a person is **already assigned** to it:
      1. If the assignment is stale (a few weeks without a PR opened after the person was assigned to the issue), ask
         to be assigned to the issue in the comments OR on Discord.
      1. If the assignment is not stale, it's OK to ask the assignee if they'll be willing to pair up.
   1. If there is no PR linked to it and no assignee, ask to be assigned to it in the comments OR on Discord.
   
_\* an issue that was reviewed by the maintainers and would be nice to get a pull request for from the community._

_\** an issue that was reviewed by the maintainers and would be a nice opportunity to onboard an open-source newbie
  into the codebase._

Once you're assigned to an issue, you can start working on your code changes. It's best to ask questions
in the issue or on Discord as early as possible, and even share your progress with the maintainers and community via a 
draft (WIP) pull request.

#### Style/Design Philosophy

* Kysely should have zero dependencies.

* Kysely should work in all JavaScript environments (node.js, deno & modern browsers), 
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

#### Getting Started

1. fork kysely.

1. clone your fork.

1. install node.js (preferably the latest even-numbered version).

1. run `npm i` in your terminal to install dependencies.

1. create a branch (we don't care about naming).

1. create a draft pull request. link the relevant issue by referring to it in the 
PR's description. E.g. `closes #123` will link the PR to issue/pull request #123.

1. implement your changes.

#### Testing

1. write functionality tests @ [/test/node](https://github.com/kysely-org/kysely/tree/master/test/node).

1. write typings tests @ [/test/typings](https://github.com/kysely-org/kysely/tree/master/test/typings)

1. install docker.

1. run `docker compose up` in your terminal to spin up database instances.

1. run `npm test` in another terminal to run tests.

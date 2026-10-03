---
name: kysely-query-examples
description: Find Kysely usage examples in the installed package's JSDoc comments, official recipes, and real-world GitHub code permalinks.
---

# Kysely query examples

Kysely ships API explanations and code examples in its JSDoc comments. These
examples are type-checked in Kysely's CI and pinned to the installed version
when read from the project's resolved package.
Locate the Kysely package resolved by the project using its package manager or
module resolver; `node_modules/kysely` is only one possible location. Search the
package's `.d.ts` files under `dist/` for the relevant API or query pattern, then
read the surrounding JSDoc explanations and fenced code examples.

For guides to common patterns, read the [recipes index](https://kysely.dev/docs/category/recipes.md)
and follow its links to the relevant Markdown recipes.

For real-world examples, follow these GitHub permalinks. Check examples against
the installed version's JSDoc before adapting them.

- [AirTrail](https://github.com/johanohly/AirTrail/blob/a34046640607ee72e1f9aed5538f84091b035246/src/lib/server/oauth/server.ts)
- [AWS Blocks](https://github.com/aws-devtools-labs/aws-blocks/blob/b0be240cd9a3416138b92dab6096fae4fe712fd8/packages/data-common/src/kysely-adapter.ts)
- [Better Auth](https://github.com/better-auth/better-auth/blob/70dd1b8193ac91b4a8a5960c27b6fb39c304f8d8/packages/kysely-adapter/src/kysely-adapter.ts)
- [bknd](https://github.com/bknd-io/bknd/blob/8c596781ff83d4dde330b97a4721ae1d458ab715/app/src/data/entities/mutation/Mutator.ts)
- [Bluesky](https://github.com/bluesky-social/atproto/blob/136e2145b893773a94e9620df37be5215cdb57a3/packages/bsky/src/data-plane/server/indexing/plugins/post.ts)
- [Cal.com](https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/packages/trpc/server/routers/viewer/bookings/get.handler.ts)
- [Canton Network](https://github.com/canton-network/wallet/blob/cb5a66807198737878326174f7e1726edf5dbf3b/core/wallet-store-sql/src/store-sql.ts)
- [Carbon](https://github.com/crbnos/carbon/blob/42ddad0c01469ad52500bf0981e5742f0b67380f/packages/database/supabase/functions/issue/index.ts)
- [Civitai](https://github.com/civitai/civitai/blob/6186c44f9178fd1a80f044e86f7b8f93233bbf31/apps/moderator/src/lib/server/user-actions.service.ts)
- [Colanode](https://github.com/colanode/colanode/blob/d649523637f0f059c936418488165d4a689da27c/packages/client/src/services/workspaces/node-service.ts)
- [Conar](https://github.com/wannabespace/conar/blob/df6b212aa429c62d15611fd87bbfc63c5a20edc5/apps/app/src/entities/connection/queries/indexes/list.ts)
- [Corsair.dev](https://github.com/corsairdev/corsair/blob/6b913c3b202836d4dd3c0e16f0b58b5d6d097507/packages/corsair/db/orm.ts)
- [Deco](https://github.com/decocms/studio/blob/5925240329cf08825529907fe192a11cec4801a0/apps/api/src/storage/task-board.ts)
- [Docmost](https://github.com/docmost/docmost/blob/7bef7b1a00d31991f009865ec14c8d06540eb1f0/apps/server/src/database/repos/page/page-permission.repo.ts)
- [Documenso](https://github.com/documenso/documenso/blob/a1d4bec1430a937395db9a4aae28979cd71c2831/packages/lib/server-only/admin/get-organisation-detailed-insights.ts)
- [Domain Locker](https://github.com/lissy93/domain-locker/blob/3605ce55726fbcb560ee7d7419e71009505d5be9/src/server/db/repos/domains.ts)
- [EmbedPDF](https://github.com/embedpdf/embed-pdf-viewer/blob/2516e2786ee894383220ecd436fbd248182ef444/cloudpdf/server/src/services/LayerService.ts)
- [EmDash](https://github.com/emdash-cms/emdash/blob/0e8977c221dd8e5111511eb226faa3d164c829ef/packages/core/src/database/repositories/media-usage.ts)
- [Evolu](https://github.com/evoluhq/evolu/blob/36f9f81917519dfeeb12cd84e4a7e64606bc96d3/packages/common/src/local-first/Query.ts)
- [Farcaster](https://github.com/farcasterxyz/fname-registry/blob/255a11f2eb294ceb0353977f1a63a0e45b32d0ff/src/transfers.ts)
- [Hot Updater](https://github.com/gronxb/hot-updater/blob/2d59b39a0089823ce0d9f2a705b56ffcf2a3e5ca/packages/server/src/adapters/kysely.ts)
- [Immich](https://github.com/immich-app/immich/blob/0733cc10ee7a0c8ebd5d37b1804b5c28944b7cdd/server/src/repositories/asset.repository.ts)
- [Materialize](https://github.com/MaterializeInc/materialize/blob/adb829aee5913d08eaccce2aee2e0df31c0a2dfd/console/src/api/materialize/cluster/replicaUtilizationHistory.ts)
- [inlang](https://github.com/opral/inlang/blob/71753086db041f50af044e24ce1e8c4ea2827235/packages/sdk/src/import-export/importFiles.ts)
- [Langfuse](https://github.com/langfuse/langfuse/blob/536c2d6905d4311cc7c2b177454a084907328c43/packages/shared/src/server/query-ast/catalog.ts)
- [Mozilla](https://github.com/mozilla/fxa/blob/0d380593eb0c70ebf37d6c39495ec64f9d040b9b/libs/accounts/passkey/src/lib/passkey.repository.ts)
- [Notesnook](https://github.com/streetwriters/notesnook/blob/bf909697d8bb2979d698334374f935a0f6161669/packages/core/src/database/sql-collection.ts)
- [Open Mercato](https://github.com/open-mercato/open-mercato/blob/fefc71d09efe2aa8c732dc6fafaa084a0e0dae3c/packages/core/src/modules/query_index/lib/engine.ts)
- [OpenClaw](https://github.com/openclaw/openclaw/blob/28340c41f8b88ae6d11488e523808315319747b5/src/config/sessions/session-accessor.sqlite-node-artifacts.ts)
- [Open Collective](https://github.com/opencollective/opencollective-api/blob/0a59b37c8b33574ee8d9d9a586d5a19506fd5921/server/graphql/v2/query/collection/OrdersCollectionQuery.ts)
- [OpenSanctions](https://github.com/opensanctions/opensanctions/blob/667f62f315467eb2150cab9fca1a75185e47cb3a/ui/lib/db.ts)
- [Parabol](https://github.com/ParabolInc/parabol/blob/d2dd4aaf2bfda5ed20b7e7c51aedb0c1f7c6b7e7/packages/server/postgres/select.ts)
- [Prisma Studio](https://github.com/prisma/studio/blob/780cfcc8ec3660a34c2fcdf75f04134c38d95602/data/postgres-core/dml.ts)
- [Profilarr](https://github.com/Dictionarry-Hub/profilarr/blob/7fec444c1dc660b261b72c55a685b9e8f6957ea6/src/lib/server/pcd/entities/customFormats/conditions/read.ts)
- [RedwoodSDK](https://github.com/redwoodjs/sdk/blob/ab57737152e098442f09b39064f09649ab25c8f1/addons/passkey/src/passkey/db/db.ts)
- [Reflect](https://github.com/team-reflect/reflect-open/blob/daf1fc1088115f02f771fd50a1064499fb8198de/packages/core/src/indexing/queries.ts)
- [ROOST Coop](https://github.com/roostorg/coop/blob/ab18bac1f1ebd858150e8559819a94b4eb172964/server/services/manualReviewToolService/modules/QueueOperations.ts)
- [Sink](https://github.com/miantiao-me/Sink/blob/bafa4e1f7e3ec034929e11e5542c4c3e116d69da/server/utils/analytics-sql.ts)
- [StudioCMS](https://github.com/withstudiocms/studiocms/blob/e8dbd3bac3182e8d54f983761c21f66776b7eb06/packages/@withstudiocms/sdk/src/modules/auth/index.ts)
- [Tailor](https://github.com/tailor-platform/sdk/blob/fa96d943d39d9f96c96c5b444fb6558351393762/packages/sdk/src/kysely/index.ts)
- [Teable](https://github.com/teableio/teable/blob/5ef2238883cad7c3980084de9a9031135fb9734f/packages/v2/adapter-table-repository-postgres/src/record/computed/outbox/ComputedUpdateOutbox.ts)
- [tldraw](https://github.com/tldraw/tldraw/blob/fdd9b4dee0d968cb92b52db2b6e0d37ffc906d74/apps/dotcom/sync-worker/src/adminRoutes.ts)
- [TrueForge](https://github.com/truefoundry/trueforge/blob/33cbe52ff63f03306ab35bc6c8e9d78c5c7104a2/packages/trueforge/src/db/postgres/session-store/queries/turns.ts)
- [Tunarr](https://github.com/chrisbenincasa/tunarr/blob/754786b59eddeba1d79943f65920873c5226ada3/server/src/tasks/fixers/BackfillMediaSourceIdFixer.ts)
- [wevm curl.md](https://github.com/wevm/curl.md/blob/72bab6a77fc0911caef36a86b52ca3d61b5580a8/src/api.ts)
- [ZenStack](https://github.com/zenstackhq/zenstack/blob/b812e1161d653fac957989c2fcba9e563a8e8f93/packages/orm/src/client/crud/operations/base.ts)

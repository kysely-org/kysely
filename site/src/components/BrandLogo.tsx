import type { JSX } from 'react'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './BrandLogo.module.css'

/**
 * Edit artwork in src/assets/brands/<id>.svg. The Docusaurus plugin combines
 * these files into /img/brand-logos.svg for both development and production.
 * Keep each source SVG's viewBox aligned with the metadata below.
 * Official brand marks normalized to single-tone `currentColor`, sourced
 * from each company's press kit, public repo, site assets, or Wikimedia
 * Commons (Bluesky, Deno, Mozilla 2024, Maersk). Maersk's badge plate is
 * dropped (the star carries the mark); Deco's lime blob plate is dropped
 * (the wordmark from decocms.com's deco-logo.svg carries the mark); Deno and RedwoodSDK are rebuilt as
 * single even-odd paths so the dino knocks out of the disc and the facets
 * out of the hexagon; Teable's white window plate is dropped and its frame
 * knocks out even-odd; Bluesky pairs the Commons butterfly with the
 * wordmark from their social-app Logotype component. Cypress is the
 * cypress.io header lockup (_astro/cypress-logo.svg); its ring arc that
 * fades out keeps the fade as an opacity mask so the external sprite
 * inherits the chip color (tonal opacity survives single-tone). Supabase
 * Lite is the docs.lite.dev site-title lockup (bolt + supabase wordmark,
 * black shading overlay dropped, hue gradient flattened); its label is
 * 'Supabase' so the chip appends 'Lite' the way their header suffixes
 * 'lite' (Prisma Studio pattern). Canton Network is the docs.canton.network
 * lockup rendered through a luminance mask: all 210 paths in original
 * stacking order, diamond fills as ink and outline rings as knockouts, so
 * the layered-C tunnel detail survives single-tone intact. Docmost and Sink have no public vector mark and
 * stay text; Reflect (raster-only orb) is text pending a sourced mark;
 * AWS stays text by policy.
 */
export type BrandLogo = { label: string; viewBox: string; id: string }

export const brandLogos: Record<string, BrandLogo> = {
  // Official lockup: a2a-protocol.org/latest/assets/a2a_logo/color/SVG/a2a_color.svg.
  // Its single blue fill inherits currentColor to match the proof wall.
  'A2A JavaScript SDK': {
    label: 'A2A',
    viewBox: '0 0 794.549 198.437',
    id: 'a2a-javascript-sdk',
  },
  // lissy93/domain-locker src/assets/logo.svg: keep the outer shadow's
  // opacity and leave the three inset stripes as transparent cutouts.
  'Domain Locker': {
    label: 'Domain Locker',
    viewBox: '0 0 959.7 998',
    id: 'domain-locker',
  },
  Bluesky: {
    label: 'Bluesky',
    viewBox: '0 0 2000 530',
    id: 'bluesky',
  },
  'Bold.org': {
    label: 'Bold.org',
    viewBox: '0 0 140 27',
    id: 'bold-org',
  },
  'Cal.com': {
    label: 'Cal.com',
    viewBox: '0 0 101 22',
    id: 'cal-com',
  },
  Cypress: {
    label: 'Cypress',
    viewBox: '0 0 119 48',
    id: 'cypress',
  },
  'Canton Network': {
    label: 'Canton',
    viewBox: '0 0 1432 369',
    id: 'canton-network',
  },
  Deco: {
    label: 'Deco',
    viewBox: '0 0 482 200',
    id: 'deco',
  },
  Deno: {
    label: 'Deno',
    viewBox: '0 0 1025 331',
    id: 'deno',
  },
  Depot: {
    label: 'Depot',
    viewBox: '0 0 256 64',
    id: 'depot',
  },
  Documenso: {
    label: 'Documenso',
    viewBox: '0 0 2248 320',
    id: 'documenso',
  },
  // Official monochrome wordmark: https://langfuse.com/brand
  Langfuse: {
    label: 'Langfuse',
    viewBox: '0 0 2245 527',
    id: 'langfuse',
  },
  Maersk: {
    label: 'Maersk',
    viewBox: '0 0 135 31',
    id: 'maersk',
  },
  Mozilla: {
    label: 'Mozilla',
    viewBox: '-179.044 -17.834 1000 239.22326',
    id: 'mozilla',
  },
  Parabol: {
    label: 'Parabol',
    viewBox: '0 0 132 27',
    id: 'parabol',
  },
  'Prisma Studio': {
    label: 'Prisma',
    viewBox: '0 0 228 72',
    id: 'prisma-studio',
  },
  tldraw: {
    label: 'tldraw',
    viewBox: '0 0 6530 1601',
    id: 'tldraw',
  },
  AirTrail: {
    label: 'AirTrail',
    viewBox: '0 0 24 24',
    id: 'airtrail',
  },
  'Better Auth': {
    label: 'Better Auth',
    viewBox: '0 0 400 51.657',
    id: 'better-auth',
  },
  bknd: {
    label: 'bknd',
    viewBox: '0 0 102 38',
    id: 'bknd',
  },
  Carbon: {
    label: 'Carbon',
    viewBox: '0 0 720 175',
    id: 'carbon',
  },
  Civitai: {
    label: 'Civitai',
    viewBox: '0 0 107 22.7',
    id: 'civitai',
  },
  Colanode: {
    label: 'Colanode',
    viewBox: '0 0 153 30',
    id: 'colanode',
  },
  Conar: {
    label: 'Conar',
    viewBox: '0 0 452 452',
    id: 'conar',
  },
  EmbedPDF: {
    label: 'EmbedPDF',
    viewBox: '58 58 134 134',
    id: 'embedpdf',
  },
  EmDash: {
    label: 'EmDash',
    viewBox: '0 0 471 118',
    id: 'emdash',
  },
  Evolu: {
    label: 'Evolu',
    viewBox: '0 0 99 23',
    id: 'evolu',
  },
  Farcaster: {
    label: 'Farcaster',
    viewBox: '0 0 683 95',
    id: 'farcaster',
  },
  Founderpath: {
    label: 'Founderpath',
    viewBox: '0 0 167 28',
    id: 'founderpath',
  },
  'Hot Updater': {
    label: 'Hot Updater',
    viewBox: '0 0 447 652',
    id: 'hot-updater',
  },
  Immich: {
    label: 'Immich',
    viewBox: '0 0 792 266.25',
    id: 'immich',
  },
  Materialize: {
    label: 'Materialize',
    viewBox: '0 0 78 65',
    id: 'materialize',
  },
  inlang: {
    label: 'inlang',
    viewBox: '0 0 256 256',
    id: 'inlang',
  },
  MikroORM: {
    label: 'MikroORM',
    viewBox: '0 0 3063.6 460.827',
    id: 'mikroorm',
  },
  Notesnook: {
    label: 'Notesnook',
    viewBox: '0 0 1024 1024',
    id: 'notesnook',
  },
  'Open Collective': {
    label: 'Open Collective',
    viewBox: '0 0 137 23',
    id: 'open-collective',
  },
  'Open.cx': {
    label: 'Open.cx',
    viewBox: '0 0 310 112',
    id: 'open-cx',
  },
  // Official apps/mercato/public/open-mercato.svg; omit the gradient tile.
  'Open Mercato': {
    label: 'Open Mercato',
    viewBox: '38 33 100 111',
    id: 'open-mercato',
  },
  OpenClaw: {
    label: 'OpenClaw',
    viewBox: '0 0 120 120',
    id: 'openclaw',
  },
  OpenSanctions: {
    label: 'OpenSanctions',
    viewBox: '0 0 505 78',
    id: 'opensanctions',
  },
  Profilarr: {
    label: 'Profilarr',
    viewBox: '573.4 107 1556.6 378',
    id: 'profilarr',
  },
  RedwoodSDK: {
    label: 'RedwoodSDK',
    viewBox: '0 0 438 69',
    id: 'redwoodsdk',
  },
  Replicas: {
    label: 'Replicas',
    viewBox: '0 0 225 300',
    id: 'replicas',
  },
  'ROOST Coop': {
    label: 'ROOST',
    viewBox: '0 0 156 48',
    id: 'roost-coop',
  },
  'Sesame Care': {
    label: 'Sesame Care',
    viewBox: '0 0 1556 502',
    id: 'sesame-care',
  },
  StudioCMS: {
    label: 'StudioCMS',
    viewBox: '0 0 755 792',
    id: 'studiocms',
  },
  'Supabase Lite': {
    label: 'Supabase',
    viewBox: '0 0 581 113',
    id: 'supabase-lite',
  },
  Tailor: {
    label: 'Tailor',
    viewBox: '0 0 82 31',
    id: 'tailor',
  },
  Teable: {
    label: 'Teable',
    viewBox: '0 0 24 24',
    id: 'teable',
  },
  // Official wordmark: truefoundry/trueforge docs/logo/light.svg
  TrueForge: {
    label: 'TrueForge',
    viewBox: '0 0 614 100',
    id: 'trueforge',
  },
  Tunarr: {
    label: 'Tunarr',
    viewBox: '0 3 32 25',
    id: 'tunarr',
  },
  'wevm curl.md': {
    label: 'wevm',
    viewBox: '0 0 311 63',
    id: 'wevm-curl-md',
  },
  ZenStack: {
    label: 'ZenStack',
    viewBox: '0 0 36 36',
    id: 'zenstack',
  },
}

export function BrandLogoSvg({ logo }: { logo: BrandLogo }): JSX.Element {
  const spriteUrl = useBaseUrl('/img/brand-logos.svg')

  return (
    <svg
      aria-label={logo.label}
      className={styles.brandLogo}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={logo.viewBox}
    >
      <use href={`${spriteUrl}#${logo.id}`} />
    </svg>
  )
}

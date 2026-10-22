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
  // Official wordmark: logtide-dev/logtide, packages/frontend/static/logo/dark.svg.
  LogTide: {
    label: 'LogTide',
    viewBox: '-1 137 5387 1463',
    markup:
      '<g><g transform="translate(1794.5 301.1)"><path d="M0 876.25C0 888.75 11.25 900 23.75 900L137.5 900C150 900 161.25 888.75 161.25 876.25L161.25 80.0001C161.25 36.25 125 0 81.25 0C36.25 0 0 36.25 0 80.0001L0 876.25Z" fill-rule="evenodd" transform="translate(0 16.25)" /><path d="M331.25 935C526.25 935 665 796.25 665 598.75C665 403.75 526.25 265 331.25 265C137.5 265 0 403.75 0 598.75C0 796.25 137.5 935 331.25 935L331.25 935ZM331.25 790C230 790 157.5 712.5 157.5 598.75C157.5 487.5 230 410 331.25 410C435 410 507.5 487.5 507.5 598.75C507.5 712.5 435 790 331.25 790L331.25 790ZM1210.8 598.75C1210.8 710 1138.3 787.5 1037.05 787.5C933.3 787.5 860.8 710 860.8 598.75C860.8 487.5 933.3 410 1037.05 410C1138.3 410 1210.8 487.5 1210.8 598.75L1210.8 598.75ZM703.3 598.75C703.3 793.75 828.3 932.5 1004.55 932.5C1085.8 932.5 1155.8 902.5 1207.05 851.25L1207.05 880C1207.05 1011.25 1128.3 1056.25 1045.8 1056.25C985.8 1056.25 934.55 1046.25 888.3 1021.25C869.55 1011.25 848.3 1005 832.05 1005C789.55 1005 760.8 1037.5 760.8 1073.75C760.8 1180 973.3 1201.25 1045.8 1201.25C1219.55 1201.25 1368.3 1093.75 1368.3 880L1368.3 345C1368.3 301.25 1332.05 265 1287.05 265C1243.3 265 1207.05 301.25 1207.05 345L1207.05 346.25C1155.8 295 1085.8 265 1004.55 265C828.3 265 703.3 403.75 703.3 598.75L703.3 598.75ZM1717.85 411.25C1756.6 411.25 1787.85 380 1787.85 341.25C1787.85 302.5 1756.6 271.25 1717.85 271.25L1669.1 271.25L1669.1 173.75C1669.1 130 1632.85 93.75 1589.1 93.75C1544.1 93.75 1507.85 130 1507.85 173.75L1507.85 271.25L1459.1 271.25C1420.35 271.25 1389.1 302.5 1389.1 341.25C1389.1 380 1420.35 411.25 1459.1 411.25L1507.85 411.25L1507.85 892.5C1507.85 905 1519.1 916.25 1531.6 916.25L1645.35 916.25C1657.85 916.25 1669.1 905 1669.1 892.5L1669.1 411.25L1717.85 411.25ZM1824.9 892.5C1824.9 905 1836.15 916.25 1848.65 916.25L1962.4 916.25C1974.9 916.25 1986.15 905 1986.15 892.5L1986.15 346.25C1986.15 302.5 1949.9 266.25 1906.15 266.25C1861.15 266.25 1824.9 302.5 1824.9 346.25L1824.9 892.5ZM1807.4 97.5C1807.4 151.25 1851.15 195 1906.15 195C1959.9 195 2003.65 151.25 2003.65 97.5C2003.65 43.7501 1959.9 0 1906.15 0C1851.15 0 1807.4 43.7501 1807.4 97.5L1807.4 97.5ZM2381.95 790C2278.2 790 2205.7 712.5 2205.7 598.75C2205.7 487.5 2278.2 410 2381.95 410C2483.2 410 2555.7 487.5 2555.7 598.75C2555.7 712.5 2483.2 790 2381.95 790L2381.95 790ZM2713.2 96.2501C2713.2 52.5 2676.95 16.25 2631.95 16.25C2588.2 16.25 2551.95 52.5 2551.95 96.2501L2551.95 345C2500.7 293.75 2430.7 265 2349.45 265C2173.2 265 2048.2 403.75 2048.2 598.75C2048.2 796.25 2186.95 935 2381.95 935C2575.7 935 2713.2 796.25 2713.2 598.75L2713.2 96.2501ZM3306.5 655C3339 655 3384 638.75 3384 575C3384 393.75 3256.5 265 3077.75 265C2891.5 265 2759 403.75 2759 598.75C2759 793.75 2896.5 932.5 3090.25 932.5C3160.25 932.5 3341.5 908.75 3341.5 810C3341.5 773.75 3312.75 741.25 3270.25 741.25C3254 741.25 3234 746.25 3214 757.5C3176.5 780 3137.75 787.5 3090.25 787.5C3007.75 787.5 2944 735 2922.75 655L3306.5 655ZM3077.75 410C3154 410 3211.5 462.5 3224 541.25L2922.75 541.25C2942.75 461.25 3001.5 410 3077.75 410L3077.75 410Z" transform="translate(206.25 0)" /></g><g transform="translate(-0.001 137.995)"><path d="M577.05 0C577.05 0 577.05 403.931 577.05 403.931C577.05 423.544 567.303 441.874 551.043 452.838C534.782 463.804 514.135 465.97 495.952 458.619C495.952 458.619 0 258.123 0 258.123C129.179 222.563 282.057 160.75 447.573 72.745C491.373 49.4561 534.609 25.135 577.051 0C577.051 0 577.05 0 577.05 0Z" fill-rule="evenodd" transform="translate(395.491 998.161)" /><path d="M193.542 0.00201416C193.542 0.00201416 193.542 417.889 193.542 417.889C193.542 437.693 183.7 456.204 167.279 467.276C150.858 478.35 130.01 480.537 111.648 473.114C111.648 473.114 0 427.978 0 427.978C0 427.978 0 128.889 0 128.889C67.1221 87.509 131.955 44.2451 193.541 0C193.541 0 193.543 0.00201416 193.543 0.00201416L193.542 0.00201416Z" fill-rule="evenodd" transform="translate(1022.973 838.793)" /><path d="M152.879 6.10352e-05C152.879 6.10352e-05 152.879 457.044 152.879 457.044C152.879 476.848 143.037 495.359 126.616 506.431C110.195 517.505 89.3469 519.692 70.985 512.269C70.985 512.269 0 483.573 0 483.573C0 483.573 0 122.627 0 122.627C54.075 82.131 105.272 41.033 152.878 0C152.878 0 152.88 0 152.88 0L152.879 6.10352e-05Z" fill-rule="evenodd" transform="translate(1266.948 679.178)" /><path d="M1419.83 498.728C1504.17 406.12 1557.49 320.256 1566.03 253.859C1582.59 124.965 1425.83 104.629 1185.68 184.48C1181.68 182.427 1177.57 180.542 1173.35 178.836C1173.35 178.836 1121.34 157.811 1121.34 157.811C1495.99 -3.30223 1758.92 -1.40022 1735.64 179.759C1721.26 291.598 1600.65 449.606 1419.83 611.301C1372.69 653.454 1321.46 695.858 1266.95 737.76C1250.43 750.458 1233.61 763.109 1216.51 775.694C1155.23 820.806 1090.37 865.056 1022.97 907.48C1006.31 917.968 989.495 928.346 972.54 938.598C922.455 968.879 871.158 998.06 819.056 1025.76C638.75 1121.63 474.371 1186.22 340.971 1218.13C120.306 1270.91 -15.5872 1234.27 1.43277 1101.85C15.9318 989.047 138.51 829.273 321.94 666.12C321.94 666.12 321.94 383.706 321.94 383.706C321.94 363.671 331.897 344.947 348.508 333.746C365.118 322.545 386.209 320.331 404.784 327.84C404.784 327.84 909.979 532.072 909.979 532.072C947.79 547.358 972.54 584.061 972.54 624.844C972.54 624.844 972.54 860.761 972.54 860.761C989.553 850.028 1006.37 839.155 1022.97 828.168C1022.97 828.168 1022.97 624.844 1022.97 624.844C1022.97 563.506 985.749 508.304 928.88 485.316C928.88 485.316 525.251 322.143 525.251 322.143C525.251 322.143 525.251 59.5678 525.251 59.5678C525.251 39.7639 535.093 21.2529 551.514 10.1809C567.935 -0.893143 588.783 -3.08014 607.145 4.34286C607.145 4.34286 1154.44 225.597 1154.44 225.597C1163.56 229.281 1171.91 234.22 1179.32 240.166C1202.44 258.695 1216.51 287.008 1216.51 317.639C1216.51 317.639 1216.51 687.058 1216.51 687.058C1233.8 673.144 1250.62 659.197 1266.95 645.254C1266.95 645.254 1266.95 317.639 1266.95 317.639C1266.95 315.605 1266.9 313.578 1266.82 311.559C1266.82 311.559 1357.75 348.319 1357.75 348.319C1389.78 361.264 1412.36 389.691 1418.28 422.904C1419.3 428.602 1419.82 434.438 1419.82 440.363C1419.82 440.363 1419.82 498.732 1419.82 498.732L1419.83 498.729C1419.83 498.729 1419.83 498.728 1419.83 498.728ZM321.94 718.467C203.594 834.079 126.782 943.794 116.391 1024.64C104.306 1118.67 184.462 1154.93 321.94 1136.66C321.94 1136.66 321.94 718.465 321.94 718.465L321.94 718.467C321.94 718.467 321.94 718.467 321.94 718.467Z" fill-rule="evenodd" /></g></g>',
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

export function BrandLogoSvg({
  logo,
  loaded,
  showFallback,
}: {
  logo: BrandLogo
  loaded: boolean
  showFallback: boolean
}): JSX.Element {
  const spriteUrl = useBaseUrl('/img/brand-logos.svg')
  const [x, y, width, height] = logo.viewBox.split(' ').map(Number)

  return (
    <svg
      aria-label={logo.label}
      className={styles.brandLogo}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={logo.viewBox}
    >
      {!loaded && showFallback && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          dominantBaseline="central"
          fontSize={Math.min(height * 0.75, width / (logo.label.length * 0.65))}
          textAnchor="middle"
        >
          {logo.label}
        </text>
      )}
      <use
        href={`${spriteUrl}#${logo.id}`}
        visibility={loaded ? 'visible' : 'hidden'}
      />
    </svg>
  )
}

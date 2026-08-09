import type {
  Options as PresetClassicOptions,
  ThemeConfig as PresetClassicThemeConfig,
} from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import type { MermaidConfig } from 'mermaid'
import type { PluginOptions as LLMsTXTPluginOptions } from '@signalwire/docusaurus-plugin-llms-txt'
import type { PluginOptions as VercelAnalyticsPluginOptions } from '@docusaurus/plugin-vercel-analytics'
import { darkPlus, lightPlus } from './src/prismThemes'
import { socialIconPaths } from './src/components/socialIconPaths'

function socialNavbarItem(
  label: string,
  href: string,
  icon: { d: string; evenOdd?: boolean; viewBox: string },
) {
  const pathRules = icon.evenOdd
    ? ' fill-rule="evenodd" clip-rule="evenodd"'
    : ''

  return {
    position: 'right' as const,
    type: 'html' as const,
    value: `<a class="navbar-social" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}"><svg viewBox="${icon.viewBox}" xmlns="http://www.w3.org/2000/svg"><path${pathRules} d="${icon.d}"/></svg></a>`,
  }
}

export default {
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
    mdx1Compat: {
      admonitions: false,
      comments: false,
      headingIds: false,
    },
    mermaid: true,
  },
  onBrokenAnchors: 'throw',
  onBrokenLinks: 'throw',
  onDuplicateRoutes: 'throw',
  organizationName: 'kysely-org',
  plugins: [
    // `docusaurus start` has no Pagefind bundle (it's generated from the
    // built HTML), which would leave the search button dead in dev. Serve
    // the last production build's index instead: content may be stale, but
    // search UI work doesn't need a 90s rebuild per iteration.
    function pagefindDevServer() {
      return {
        configureWebpack: () => ({
          devServer: {
            static: {
              directory: `${__dirname}/build/pagefind`,
              publicPath: '/pagefind',
            },
          },
        }),
        name: 'pagefind-dev-server',
      }
    },
    [
      '@signalwire/docusaurus-plugin-llms-txt',
      {
        content: {
          // https://www.npmjs.com/package/@signalwire/docusaurus-plugin-llms-txt#content-selectors
          contentSelectors: [
            '.theme-doc-markdown', // Docusaurus main content area
            'main .container .col', // Bootstrap-style layout
            'main .theme-doc-wrapper', // Docusaurus wrapper
            'article', // Semantic article element
            'main .container', // Broader container
            'main', // Fallback to main element
            '.code-example',
          ],
          enableLlmsFullTxt: true,
          includeGeneratedIndex: false,
          includePages: true,
          includeVersionedDocs: false,
          relativePaths: false,
        },
        depth: 3,
        onRouteError: 'throw',
        siteDescription:
          'The most powerful type-safe SQL query builder for TypeScript',
        siteTitle: 'Kysely',
      } satisfies LLMsTXTPluginOptions,
    ],
    [
      'vercel-analytics',
      { debug: true, mode: 'auto' } satisfies Omit<
        VercelAnalyticsPluginOptions,
        'id'
      >,
    ],
  ],
  presets: [
    [
      'classic',
      {
        blog: false,
        docs: {
          editUrl: 'https://github.com/kysely-org/kysely/tree/master/site',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            require.resolve('@radix-ui/colors/sky.css'),
            require.resolve('@radix-ui/colors/gray.css'),
            require.resolve('@radix-ui/colors/blue.css'),
            require.resolve('@radix-ui/colors/green.css'),
            require.resolve('@radix-ui/colors/yellow.css'),
          ],
        },
      } satisfies PresetClassicOptions,
    ],
  ],
  projectName: 'kysely',
  tagline: 'The most powerful type-safe SQL query builder for TypeScript',
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        autoCollapseCategories: true,
        hideable: true,
      },
    },
    // Minimal VitePress-style footer. Vercel badge stays: they host us for
    // free.
    footer: {
      copyright: [
        `Released under the MIT License.`,
        `Copyright © 2022-present Sami Koskimäki & Kysely contributors.`,
        `<a class="footer-vercel" href="https://vercel.com/?utm_source=kysely&utm_campaign=oss" target="_blank" rel="noopener noreferrer"><img src="/img/powered-by-vercel.svg" width="176" height="36" alt="Powered by Vercel" /></a>`,
      ].join('<br/>'),
    },
    headTags: [
      {
        attributes: {
          href: 'https://fonts.googleapis.com',
          rel: 'preconnect',
        },
        tagName: 'link',
      },
      {
        attributes: {
          crossOrigin: 'anonymous',
          href: 'https://fonts.gstatic.com',
          rel: 'preconnect',
        },
        tagName: 'link',
      },
      {
        attributes: {
          as: 'style',
          onLoad: "this.onload=null;this.rel='stylesheet'",
          href: 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
          rel: 'preload',
        },
        tagName: 'link',
      },
      {
        attributes: {
          as: 'image',
          fetchpriority: 'high',
          href: '/demo-poster.webp',
          rel: 'preload',
        },
        tagName: 'link',
      },
    ],
    mermaid: {
      options: {
        sequence: {
          mirrorActors: false,
          showSequenceNumbers: true,
        },
      } satisfies MermaidConfig,
    },
    metadata: [
      {
        content:
          'Kysely is the most powerful type-safe SQL query builder for TypeScript. Get unparalleled autocompletion and compile-time type safety for complex queries, joins, and subqueries. Used in production by Deno, Maersk, and Cal.com. Modern TypeScript, zero runtime overhead.',
        name: 'description',
      },
    ],
    navbar: {
      items: [
        {
          position: 'left',
          type: 'search',
        },
        {
          docId: 'intro',
          label: 'Docs',
          position: 'right',
          type: 'doc',
        },
        {
          href: 'https://play.kysely.dev',
          label: 'Playground',
          position: 'right',
        },
        {
          href: 'https://kysely-org.github.io/kysely-apidoc',
          label: 'API docs',
          position: 'right',
        },
        {
          ...socialNavbarItem(
            'GitHub',
            'https://github.com/kysely-org/kysely',
            socialIconPaths.github,
          ),
          className: 'navbar-group-start',
        },
        socialNavbarItem(
          'Discord',
          'https://discord.gg/xyBJ3GwvAm',
          socialIconPaths.discord,
        ),
        socialNavbarItem(
          'Bluesky',
          'https://bsky.app/profile/kysely.dev',
          socialIconPaths.bluesky,
        ),
      ],
      logo: {
        alt: 'Kysely Logo',
        height: 32,
        src: 'img/logo.svg',
        width: 32,
      },
      title: 'Kysely',
    },
    prism: {
      darkTheme: darkPlus,
      theme: lightPlus,
    },
  } satisfies PresetClassicThemeConfig,
  clientModules: ['./src/clientModules/navbarScroll.ts'],
  themes: ['@docusaurus/theme-mermaid'],
  title: 'Kysely',
  url: 'https://kysely.dev',
} satisfies Config

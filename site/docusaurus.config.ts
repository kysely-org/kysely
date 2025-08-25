import type {
  Options as PresetClassicOptions,
  ThemeConfig as PresetClassicThemeConfig,
} from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import type { MermaidConfig } from 'mermaid'
import { themes } from 'prism-react-renderer'
import type { PluginOptions as LLMsTXTPluginOptions } from '@signalwire/docusaurus-plugin-llms-txt'
import type { PluginOptions as VercelAnalyticsPluginOptions } from '@docusaurus/plugin-vercel-analytics'

export default {
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  markdown: {
    mdx1Compat: {
      admonitions: false,
      comments: false,
      headingIds: false,
    },
    mermaid: true,
  },
  onBrokenAnchors: 'throw',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  onDuplicateRoutes: 'throw',
  organizationName: 'kysely-org',
  plugins: [
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
    algolia: {
      // Public API key, safe to expose. See https://docusaurus.io/docs/search#using-algolia-docsearch
      apiKey: 'ebee59ab1b71803be5983f6dbfeea352',
      appId: 'MDKJWTIJFR',
      contextualSearch: true,
      indexName: 'kysely',
    },
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
    footer: {
      links: [
        {
          items: [
            { label: 'Introduction', to: '/docs/intro' },
            { label: 'Getting started', to: '/docs/getting-started' },
            { label: 'Playground', to: '/docs/playground' },
            { label: 'Migrations', to: '/docs/migrations' },
            // { label: 'Examples', to: '/docs/category/examples' },
            { label: 'Recipes', to: '/docs/category/recipes' },
            { label: 'Other runtimes', to: '/docs/category/other-runtimes' },
            { label: 'Dialects', to: '/docs/dialects' },
            { label: 'Generating types', to: '/docs/generating-types' },
            { label: 'Plugin system', to: '/docs/plugins' },
          ],
          title: 'Docs',
        },
        {
          items: [
            { label: 'SELECT', to: '/docs/category/select' },
            { label: 'WHERE', to: '/docs/category/where' },
            { label: 'JOIN', to: '/docs/category/join' },
            { label: 'INSERT', to: '/docs/category/insert' },
            { label: 'UPDATE', to: '/docs/category/update' },
            { label: 'DELETE', to: '/docs/category/delete' },
            { label: 'Transactions', to: '/docs/category/transactions' },
            { label: 'CTE', to: '/docs/category/cte' },
          ],
          title: 'Examples',
        },
        {
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/xyBJ3GwvAm',
            },
            {
              label: 'Bluesky',
              href: 'https://bsky.app/profile/kysely.dev',
            },
          ],
          title: 'Community',
        },
        {
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/kysely-org/kysely',
            },
            {
              label: 'API docs',
              href: 'https://kysely-org.github.io/kysely-apidoc/',
            },
          ],
          title: 'Other',
        },
        {
          items: [
            {
              html: `<a href="https://vercel.com/?utm_source=kysely&utm_campaign=oss"><img src="/img/powered-by-vercel.svg" style="width: 214px; height: 44px" alt="Powered by Vercel" /></a>`,
            },
          ],
          title: 'Sponsors',
        },
      ],
      style: 'dark',
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
          docId: 'intro',
          label: 'Docs',
          position: 'left',
          type: 'doc',
        },
        {
          href: 'https://github.com/kysely-org/kysely',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://kysely-org.github.io/kysely-apidoc',
          label: 'API docs',
          position: 'right',
        },
      ],
      logo: {
        alt: 'Kysely Logo',
        height: 32,
        src: 'img/logo.svg',
        width: 32,
      },
      style: 'dark',
      title: 'Kysely',
    },
    prism: {
      darkTheme: themes.dracula,
      theme: themes.github,
    },
  } satisfies PresetClassicThemeConfig,
  themes: ['@docusaurus/theme-mermaid'],
  title: 'Kysely',
  url: 'https://kysely.dev',
} satisfies Config

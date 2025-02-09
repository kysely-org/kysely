import type {
  Options as PresetClassicOptions,
  ThemeConfig as PresetClassicThemeConfig,
} from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import { themes } from 'prism-react-renderer'

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
  },
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  organizationName: 'kysely-org',
  presets: [
    [
      'classic',
      {
        blog: {
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          showReadingTime: true,
        },
        docs: {
          editUrl: 'https://github.com/kysely-org/kysely/tree/master/site',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        gtag: {
          anonymizeIP: true,
          trackingID: 'G-DWKJ0RXL1F',
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
  tagline: 'The type-safe SQL query builder for TypeScript',
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
  title: 'Kysely',
  url: 'https://kysely.dev',
} satisfies Config

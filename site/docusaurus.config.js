// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Kysely',
  tagline: 'The type-safe SQL query builder for TypeScript',
  url: 'https://kysely.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'kysely-org', // Usually your GitHub org/user name.
  projectName: 'kysely', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        gtag: {
          trackingID: 'G-DWKJ0RXL1F',
          anonymizeIP: true,
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/kysely-org/kysely/tree/master/site',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            // import css from radix-ui
            require.resolve('@radix-ui/colors/sky.css'),
            require.resolve('@radix-ui/colors/gray.css'),
            require.resolve('@radix-ui/colors/blue.css'),
            require.resolve('@radix-ui/colors/green.css'),
            require.resolve('@radix-ui/colors/yellow.css'),
          ],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },

      algolia: {
        appId: 'MDKJWTIJFR',
        // Public API key, safe to expose. See https://docusaurus.io/docs/search#using-algolia-docsearch
        apiKey: 'ebee59ab1b71803be5983f6dbfeea352',
        indexName: 'kysely',
        contextualSearch: true,
      },

      docs: {
        sidebar: { hideable: true, autoCollapseCategories: true },
      },
      navbar: {
        style: 'dark',
        title: 'Kysely',
        logo: {
          alt: 'Kysely Logo',
          src: 'img/logo.svg',
          width: 32,
          height: 32,
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Docs',
          },

          {
            href: 'https://github.com/kysely-org/kysely',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://kysely-org.github.io/kysely/',
            label: 'API docs',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',

        links: [
          {
            title: 'Docs',

            items: [
              {
                label: 'Introduction',
                to: '/docs/intro',
              },
              {
                label: 'Getting started',
                to: '/docs/getting-started',
              },

              {
                label: 'Playground',
                to: '/docs/playground',
              },
              {
                label: 'Migrations',
                to: '/docs/migrations',
              },

              {
                label: 'Generating types',
                to: '/docs/generating-types',
              },
            ],
          },
          {
            title: 'Examples',
            items: [
              { label: 'SELECT', to: '/docs/category/select' },
              { label: 'UPDATE', to: '/docs/category/update' },
              { label: 'DELETE', to: '/docs/category/delete' },
              { label: 'INSERT', to: '/docs/category/insert' },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/xyBJ3GwvAm',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/kysely_',
              },
            ],
          },
          {
            title: 'Other',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/kysely-org/kysely',
              },
              {
                label: 'API docs',
                href: 'https://kysely-org.github.io/kysely/',
              },
            ],
          },
          {
            title: 'Sponsors',
            items: [
              {
                html: `<a href="https://vercel.com/?utm_source=kysely&utm_campaign=oss"><img src="/img/powered-by-vercel.svg" style="width: 214px; height: 44px" alt="Powered by Vercel" /></a>`,
              },
            ],
          },
        ],
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
}

module.exports = config

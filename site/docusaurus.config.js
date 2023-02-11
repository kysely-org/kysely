// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Kysely',
  tagline: 'The type-safe SQL query builder for TypeScript',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
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
          trackingID: 'G-999X9XX9XX',
          anonymizeIP: true,
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
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
      docs: {
        sidebar: { hideable: true, autoCollapseCategories: true },
      },
      navbar: {
        style: 'dark',
        title: 'Kysely',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Docs',
          },
          {
            type: 'doc',
            docId: 'installation',
            position: 'left',
            label: 'Getting started',
          },
          {
            href: 'https://github.com/koskimas/kysely',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://koskimas.github.io/kysely/',
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
                to: '/docs/installation',
              },
              {
                label: 'Getting started',
                to: '/docs/installation',
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
                label: 'Examples',
                to: '/docs/category/examples',
              },
              {
                label: 'Generating types',
                to: '/docs/generating-types',
              },
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
              // {
              //   label: 'Stack Overflow',
              //   href: 'https://stackoverflow.com/questions/tagged/kysely',
              // },
            ],
          },
          {
            title: 'Other',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/koskimas/kysely',
              },
              {
                label: 'API docs',
                href: 'https://koskimas.github.io/kysely/',
              },
            ],
          },
        ],
        //copyright: `Copyright © ${new Date().getFullYear()}`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
}

module.exports = config

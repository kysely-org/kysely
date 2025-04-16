import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { Discord, X } from '@/components/icons'

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/kysely-org/kysely',
  nav: {
    title: (
      <>
        <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
          Kysely
        </span>
      </>
    ),
    transparentMode: 'top',
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
    {
      type: 'icon',
      url: 'https://x.com/kysely_',
      text: 'X',
      icon: X({}),
      external: true,
    },
    {
      type: 'icon',
      url: 'https://discord.gg/xyBJ3GwvAm',
      text: 'Discord',
      icon: Discord({}),
      external: true,
    },
  ],
}

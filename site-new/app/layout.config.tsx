import { type LinkItemType } from 'fumadocs-ui/layouts/docs'
import { AlbumIcon, LayoutTemplate } from 'lucide-react'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export const linkItems: LinkItemType[] = [
  {
    icon: <AlbumIcon />,
    text: 'Blog',
    url: '/blog',
    active: 'nested-url',
  },
  {
    text: 'Showcase',
    url: '/showcase',
    icon: <LayoutTemplate />,
    active: 'url',
  },
]

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
    ...linkItems,
  ],
}

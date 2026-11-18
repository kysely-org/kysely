import React, { JSX } from 'react'
import clsx from 'clsx'

import { FALLBACK_STATS, GITHUB_REPO_URL } from './liveStats'
import { socialIconPaths } from './socialIconPaths'

interface GitHubNavbarItemProps {
  className?: string
  mobile?: boolean
}

export function GitHubNavbarItem({
  className,
  mobile = false,
}: GitHubNavbarItemProps): JSX.Element {
  const { d, viewBox } = socialIconPaths.github

  return (
    <div
      className={clsx(
        { navbar__item: !mobile, 'menu__list-item': mobile },
        className,
      )}
    >
      <a
        aria-label="Star Kysely on GitHub"
        className="navbar-social navbar-github"
        href={GITHUB_REPO_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
          <path clipRule="evenodd" d={d} fillRule="evenodd" />
        </svg>
        <span className="navbar-github-stars">{FALLBACK_STATS.stars}</span>
      </a>
    </div>
  )
}

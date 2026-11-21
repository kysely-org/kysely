import { useEffect, useState } from 'react'

export const GITHUB_REPO_URL = 'https://github.com/kysely-org/kysely'

// Rendered at build time and shown until the live numbers arrive, and the
// permanent values for visitors with JavaScript disabled or the APIs blocked.
export const FALLBACK_STATS = {
  contributors: '150+',
  downloads: '20M+',
  stars: '14k+',
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    notation: 'compact',
  })
    .format(value)
    .replace('K', 'k')
}

let starsRequest: Promise<number | null> | undefined

function fetchStars(): Promise<number | null> {
  starsRequest ??= fetch('https://api.github.com/repos/kysely-org/kysely')
    .then((response) => response.json())
    .then((data) =>
      typeof data?.stargazers_count === 'number' ? data.stargazers_count : null,
    )
    .catch(() => null)

  return starsRequest
}

export function useGitHubStars(): number | null {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    fetchStars().then((value) => {
      if (active) {
        setStars(value)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return stars
}

import type { Plugin } from '@docusaurus/types'

export default function preloadDemoPoster(): Plugin {
  return {
    name: 'preload-demo-poster',
    injectHtmlTags() {
      return {
        // The classic preset's theme initializer runs before site plugins.
        // Read its resolved theme, including saved and URL preferences.
        preBodyTags: [
          {
            tagName: 'script',
            innerHTML: `
if (location.pathname === '/') {
  const poster = document.createElement('link');
  poster.rel = 'preload';
  poster.as = 'image';
  poster.fetchPriority = 'high';
  poster.href = document.documentElement.dataset.theme === 'light'
    ? '/demo-poster-light.webp'
    : '/demo-poster.webp';
  document.head.appendChild(poster);
}`,
          },
        ],
      }
    },
  }
}

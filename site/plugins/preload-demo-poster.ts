import type { Plugin } from '@docusaurus/types'

export default function preloadDemoPoster(): Plugin {
  return {
    name: 'preload-demo-poster',
    injectHtmlTags() {
      return {
        // Start the poster before CSS, which blocks the body's theme script.
        // Match Docusaurus's URL > saved preference > system theme order.
        headTags: [
          {
            tagName: 'script',
            innerHTML: `
if (location.pathname === '/') {
  let theme = new URLSearchParams(location.search).get('docusaurus-theme');
  try { theme ||= localStorage.getItem('theme'); } catch {}
  theme ||= matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const poster = document.createElement('link');
  poster.rel = 'preload';
  poster.as = 'image';
  poster.fetchPriority = 'high';
  poster.href = theme === 'light'
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

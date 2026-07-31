// Marks <html> with `data-navbar-scrolled` once the page is scrolled, so CSS
// can draw the navbar's separating hairline only when content passes under
// it (the VitePress behavior). A data attribute rather than a class: during
// hydration Docusaurus assigns html.className wholesale, which would clobber
// an early class but leaves attributes alone.
if (typeof window !== 'undefined') {
  const update = () => {
    document.documentElement.toggleAttribute(
      'data-navbar-scrolled',
      window.scrollY > 0,
    )
  }

  window.addEventListener('scroll', update, { passive: true })
  update()
}

export {}

import clsx from 'clsx'
import { useRef } from 'react'
import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect'

import { Quote } from './Quote'
import { quotes } from './quotes'
import styles from './styles.module.css'

export function SectionQuotes() {
  const [featured, ...rest] = quotes
  const masonryRef = useRef<HTMLDivElement>(null)

  useIsomorphicLayoutEffect(() => {
    const masonry = masonryRef.current
    if (!masonry || typeof ResizeObserver === 'undefined') return

    const cards = Array.from(masonry.children) as HTMLElement[]

    const layout = () => {
      const style = getComputedStyle(masonry)
      const columns = Number(style.getPropertyValue('--columns'))
      const gap = parseFloat(style.rowGap)
      const offsets = Array<number>(columns).fill(0)

      // Resolve the new column widths before measuring after a breakpoint change.
      cards.forEach((card, index) => {
        card.style.setProperty('--column', String((index % columns) + 1))
      })
      const heights = cards.map((card) => card.getBoundingClientRect().height)

      cards.forEach((card, index) => {
        const column = index % columns
        card.style.setProperty('--offset', `${offsets[column]}px`)
        offsets[column] += heights[index] + gap
      })
      masonry.style.height = `${Math.max(0, ...offsets) - gap}px`
      masonry.dataset.packed = 'true'
    }

    // Keep the existing round-robin masonry layout with one copy of each quote.
    // Observing the cards also handles images, fonts, and text-size changes.
    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(masonry)
    cards.forEach((card) => observer.observe(card))

    return () => {
      observer.disconnect()
      delete masonry.dataset.packed
      masonry.style.removeProperty('height')
      cards.forEach((card) => {
        card.style.removeProperty('--column')
        card.style.removeProperty('--offset')
      })
    }
  }, [])

  return (
    <section className={styles.quotesSection}>
      <div className={clsx('container', styles.quotesContainer)}>
        <h2 className={styles.sectionHeading}>
          Trusted by the people who build your other tools
        </h2>
        <p className={styles.sectionSub}>
          Unprompted, in public, on the record.
        </p>
        <div className={styles.featured}>
          <Quote {...featured} />
        </div>
        <div className={styles.masonry} ref={masonryRef}>
          {rest.map((quote) => (
            <Quote key={quote.link} {...quote} />
          ))}
        </div>
      </div>
    </section>
  )
}

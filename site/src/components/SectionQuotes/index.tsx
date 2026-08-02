import clsx from 'clsx'

import { Quote } from './Quote'
import { quotes } from './quotes'
import styles from './styles.module.css'

// Masonry with row-major reading order: quotes are distributed round-robin
// into explicit column stacks (quote N goes to column N % count), so the
// first quotes head the columns and reading left-to-right follows the
// curated order in quotes.ts. The 3/2/1-column bucketings are all rendered
// and media queries display exactly one, keeping this JS-free and SSR-exact.
const COLUMN_LAYOUTS = [3, 2, 1]

export function SectionQuotes() {
  const [featured, ...rest] = quotes

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
        {COLUMN_LAYOUTS.map((columnCount) => (
          <div
            key={columnCount}
            className={clsx(styles.masonry, styles[`masonry${columnCount}`])}
          >
            {Array.from({ length: columnCount }, (_, columnIndex) => (
              <div key={columnIndex} className={styles.masonryColumn}>
                {rest
                  .filter(
                    (_, quoteIndex) => quoteIndex % columnCount === columnIndex,
                  )
                  .map((quote, index) => (
                    <Quote key={index} {...quote} />
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

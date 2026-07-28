import clsx from 'clsx'

import { Quote } from './Quote'
import { quotes } from './quotes'
import styles from './styles.module.css'

export function SectionQuotes() {
  const [featured, ...rest] = quotes

  return (
    <section className={styles.quotesSection}>
      <div className={clsx('container', styles.quotesContainer)}>
        <h2 className={styles.sectionHeading}>
          Trusted by the people who build your other tools
        </h2>
        <p className={styles.sectionSub}>Unprompted, in public, on the record.</p>
        <div className={styles.featured}>
          <Quote {...featured} />
        </div>
        <div className={styles.quotesInnerContainer}>
          {rest.map((quote, index) => (
            <Quote key={index} {...quote} />
          ))}
        </div>
      </div>
    </section>
  )
}

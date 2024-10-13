import clsx from 'clsx'

import { Quote } from './Quote'
import { quotes } from './quotes'
import styles from './styles.module.css'

export function SectionQuotes() {
  return (
    <section className={styles.quotesSection}>
      <div className={clsx('container', styles.quotesContainer)}>
        <h1>What the internet is saying</h1>
        <p>Developers are loving Kysely for its simplicity and power.</p>
        <div className={styles.quotesInnerContainer}>
          {quotes.map((quote, index) => (
            <Quote key={index} {...quote} />
          ))}
        </div>
      </div>
    </section>
  )
}

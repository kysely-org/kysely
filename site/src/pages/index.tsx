import React from 'react'
import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import { SectionFeatures } from '@site/src/components/SectionFeatures'

import styles from './index.module.css'
import { gray } from '@radix-ui/colors'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx('hero', styles.heroBanner, 'dark-theme')}>
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
          <p className={styles.heroSubtitle}>
            The type-safe SQL <br />
            query builder for TypeScript
          </p>
          <span style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <a
              href="/docs/installation"
              className="button button--primary button--md button--block"
              style={{
                background: 'var(--gray12)',
                color: 'var(--gray1)',
                borderColor: 'var(--gray12)',
              }}
            >
              Getting started
            </a>
            <a
              href="https://github.com/kysely-org/kysely"
              className="button button--secondary button--md button--block"
            >
              View on Github
            </a>
          </span>
        </div>
        <div>
          <img
            style={{
              borderRadius: 12,
              boxShadow: 'var(--shadow-elevation-medium)',
            }}
            src="https://github.com/kysely-org/kysely/raw/master/assets/demo.gif"
          />
        </div>
      </div>

      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 'calc(50% - 20px)',
          color: 'black',
          width: 40,
          fontSize: 24,
          textAlign: 'center',
        }}
      >
        ↓
      </span>
    </header>
  )
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout title={siteConfig.title}>
      <div className={styles.siteWrapper}>
        <HomepageHeader />
      </div>
      <main>
        <SectionFeatures />

        <SectionTweets />

        <SectionPlayground />

        <section
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '100vh',
            background: `radial-gradient(circle, var(--blue12) 0%, #171717 40%)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '128px 0',
              maxWidth: 460,
              textAlign: 'center',
            }}
          >
            <h1>Looking for code examples?</h1>
            <p>
              From finding a single record to complex joins, our docs have
              examples to get you started quickly.
            </p>
            <span style={{ display: 'flex', gap: 8 }}>
              <a
                href="/docs/category/examples"
                style={{ width: '220px' }}
                className="button button--primary button--lg"
              >
                Jump right in
              </a>
            </span>
          </div>
        </section>
      </main>
    </Layout>
  )
}

function TweetQuote({
  avatar,
  authorName,
  authorTitle,
  tweetLink,
  text,
}: {
  avatar: string
  tweetLink: string
  authorName: string
  authorTitle: string
  text: string
}) {
  return (
    <a
      href={tweetLink}
      style={{
        position: 'relative',
        flex: '0 1 300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        background: 'var(--gray11)',
        padding: 16,
        borderRadius: 8,
        textDecoration: 'none',
      }}
    >
      <TwitterIcon />
      <div style={{ display: 'flex', gap: 8 }}>
        <img className="avatar__photo" src={avatar} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',

            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: 'var(--gray4)' }}>{authorName}</span>
          <small style={{ color: 'var(--gray4)' }}>{authorTitle}</small>
        </div>
      </div>

      <small style={{ color: 'var(--gray6)', textAlign: 'left' }}>{text}</small>
    </a>
  )
}

function SectionTweets() {
  return (
    <section
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        background: `radial-gradient(circle, var(--sky12) 0%, #171717 40%)`,
      }}
    >
      <div className="container" style={{ textAlign: 'center' }}>
        <h1>What the internet is saying</h1>
        <p>Developers are loving Kysely for it's simplicity and power.</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <TweetQuote
            authorName={'Dax Raad'}
            authorTitle={'@SST_dev core team'}
            avatar={
              'https://pbs.twimg.com/profile_images/1602333093485891584/mmVqjFNI_400x400.jpg'
            }
            tweetLink={
              'https://twitter.com/thdxr/status/1623136475914043392?ref_src=twsrc%5Etfw'
            }
            text={"Kysely is the best written TS codebase I've ever seen"}
          />

          <TweetQuote
            authorName={'Yusuke Wada'}
            authorTitle={'Creator of @honojs'}
            avatar={
              'https://pbs.twimg.com/profile_images/15300142/profile_childfood_400x400.jpg'
            }
            text="Kysely is great. D1 will be great. This is great."
            tweetLink={
              'https://twitter.com/yusukebe/status/1581775103167066112'
            }
          />

          <TweetQuote
            authorName={'Gal Schlezinger'}
            authorTitle={'Software Developer @ Vercel, Creator of fnm'}
            avatar={
              'https://pbs.twimg.com/profile_images/1200413867437936640/SnCiBgrR_400x400.jpg'
            }
            text={'Kysely is 🐐'}
            tweetLink={'https://twitter.com/galstar/status/1645452990147436546'}
          />

          <TweetQuote
            authorName={'Theo Browne'}
            authorTitle={'CEO @ Ping Labs, tech influencer'}
            avatar={
              'https://pbs.twimg.com/profile_images/1605762947686375425/lsoGWWty_400x400.jpg'
            }
            tweetLink={'https://twitter.com/t3dotgg/status/1632949634728599552'}
            text={
              "Planetscale's DatabaseJS combined with Kysely or @DrizzleOrm is pretty dope to stay on edge"
            }
          />

          <TweetQuote
            authorName={'Johan Eliasson'}
            authorTitle={'Indiehacker & engineer, Ex-CEO @ Nhost'}
            avatar={
              'https://pbs.twimg.com/profile_images/1447184004558557193/agXMdsqe_400x400.jpg'
            }
            tweetLink={
              'https://twitter.com/elitasson/status/1642090379066449920'
            }
            text={
              "Instead of Prisma, I'm testing Kysely, Kysely Codegen, and Atlas. Works great."
            }
          />
          
          <TweetQuote
            authorName={'Mehul Mohan'}
            authorTitle={'CEO @ codedamn'}
            avatar={
              'https://pbs.twimg.com/profile_images/1418658538688155648/CREA-CYu_400x400.jpg'
            }
            text="We went with query builder because we did not have more time to waste on ORMs. ORMs might be great but we have the technical capability to pull off just using a query builder. However, we type safety and sanitization for DX and security was a must - hence kysely."
            tweetLink={
              'https://twitter.com/mehulmpt/status/1650480912759685120'
            }
          />
          
          <TweetQuote
            authorName={'Alberto Gimeno'}
            authorTitle={'Software Engineer @ Railway'}
            avatar={
              'https://pbs.twimg.com/profile_images/1614373062022922241/zUKUXrKP_400x400.jpg'
            }
            tweetLink={'https://twitter.com/gimenete/status/1653121152854765569'}
            text={
              "I'm a happy @kysely_ user. It's great to see that the code I'm writing now can work with serverless postgresql now!"
            }
          />

          <TweetQuote
            authorName={'Nicholas Griffin'}
            authorTitle={'Senior Engineer @ the BBC'}
            avatar={
              'https://pbs.twimg.com/profile_images/1468372517538701316/HnQ_WZVg_400x400.jpg'
            }
            text="😂 I don\'t actually like prisma that much, i prefer https://github.com/kysely-org/kysely, not an orm though."
            tweetLink={
              'https://twitter.com/ngriffin_uk/status/1599891725404676096'
            }
          />

          <TweetQuote
            authorName={'Sam Cook'}
            authorTitle={'Software engineer @ trygamma'}
            avatar={
              'https://pbs.twimg.com/profile_images/1612150047956672516/BGkIKXdI_400x400.jpg'
            }
            tweetLink={
              'https://twitter.com/sjc5_/status/1623210443874639873?ref_src=twsrc%5Etfw'
            }
            text={'Kysely is amazing.'}
          />
          
          <TweetQuote
            authorName={'Gannon Hall'}
            authorTitle={'Product & dev, ex-Google'}
            avatar={
              'https://pbs.twimg.com/profile_images/1603091670072819712/EArb-OH4_400x400.jpg'
            }
            tweetLink={
              'https://twitter.com/gannonh/status/1653109305368018944'
            }
            text={'Vercel just announced native postgres support and published Prisma and Kysely templates. I like the DX of Prisma and the type safety of Kysely so I use both via prisma-kysley.'}
          />

          <TweetQuote
            authorName={'@CodeMonument'}
            authorTitle="CodeMonument"
            avatar={
              'https://pbs.twimg.com/profile_images/1600267282411839489/sVc4DQth_400x400.jpg'
            }
            tweetLink={
              'https://twitter.com/CodeMonument/status/1571637269424996354'
            }
            text={`deno + @planetscale/database + kysely + kysely-planetscale is absolutely awesome! 

Knew nothing about the adapter and Kysely before and got the PoC in Code in 45 minutes. 
It's so stupidly simple! [...]
`}
          />

          <TweetQuote
            authorName={'sommelier de garrafada'}
            authorTitle="@solinvictvs"
            avatar={
              'https://pbs.twimg.com/profile_images/1380006186209181696/AGXROT4g_400x400.jpg'
            }
            tweetLink={
              'https://twitter.com/solinvictvs/status/1615549659115655169'
            }
            text={`Kysely is superior and with each release gets even more awesome`}
          />

          <TweetQuote
            authorName="Sock, the dev 🧦"
            authorTitle="@sockthedev"
            avatar="https://pbs.twimg.com/profile_images/1569584517161324544/po3hKnjN_400x400.jpg"
            tweetLink="https://twitter.com/sockthedev/status/1599814152771760128"
            text="YES! Completed the initial version of this. Finally. Huge shoutout to Kysely for making this way less painful than it should have been. The BEST TypeScript based SQL query builder. ♥️"
          />
        </div>
      </div>
    </section>
  )
}

function TwitterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 18,
        right: 18,
        height: 20,
        width: 20,
        fill: 'var(--blue8)',
      }}
    >
      <g>
        <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
      </g>
    </svg>
  )
}

function SectionPlayground() {
  return (
    <section className="container">
      <div
        style={{
          marginTop: 20,
          width: '100%',
          height: `calc(100vh - var(--ifm-navbar-height))`,
          border: 0,
          overflow: 'hidden',
          padding: '40px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1>Try it out for yourself!</h1>
        <p>
          Modify the query on the left and view the generated SQL on the right.
        </p>
        <iframe
          src="https://stackblitz.com/edit/react-ts-pppzf5?embed=1&file=playground.ts&hideExplorer=1&hideNavigation=1&theme=dark"
          style={{
            width: '100%',
            height: '100%',
            border: `1px solid ${gray.gray11}`,
            overflow: 'hidden',
            padding: 0,
            background: gray.gray12,
            borderRadius: 8,
          }}
          title="Kysely Demo"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>
    </section>
  )
}

import React from 'react'
import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import { SectionFeatures } from '@site/src/components/SectionFeatures'
import D1Logo from '../../static/img/d1.svg'

import styles from './index.module.css'
import { gray } from '@radix-ui/colors'
import { DemoVideo } from '../components/DemoVideo'

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
              href="/docs/getting-started"
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

        <DemoVideo />
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

        <SectionDatabases />

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
        <img
          className="avatar__photo"
          alt={`${authorName}'s avatar picture`}
          src={avatar}
        />
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
            authorName={'Ben Holmes'}
            authorTitle={'Astro SWE'}
            avatar={'/img/avatars/benholmes.jpeg'}
            tweetLink={
              'https://twitter.com/BHolmesDev/status/1673715776946143233'
            }
            text={"Kysely I love you, but I still can't spell your name"}
          />

          <TweetQuote
            authorName={'Dax "thdxr" Raad'}
            authorTitle={'SST core team'}
            avatar={'/img/avatars/daxraad.jpeg'}
            tweetLink={
              'https://twitter.com/thdxr/status/1623136475914043392?ref_src=twsrc%5Etfw'
            }
            text={"Kysely is the best written TS codebase I've ever seen"}
          />

          <TweetQuote
            authorName={'Harminder Virk'}
            authorTitle={'AdonisJS creator'}
            avatar={'/img/avatars/harminder.jpeg'}
            tweetLink={
              'https://twitter.com/AmanVirk1/status/1666636685583568897'
            }
            text={
              'Kysely is great. Keeping an eye on it to see how it evolves in coming months'
            }
          />

          <TweetQuote
            authorName={'Gal Schlezinger'}
            authorTitle={'fnm creator, Vercel SWE'}
            avatar={'/img/avatars/gal.jpeg'}
            text={'Kysely is 🐐'}
            tweetLink={'https://twitter.com/galstar/status/1645452990147436546'}
          />

          <TweetQuote
            authorName={'Yusuke "yusukebe" Wada'}
            authorTitle={'Hono creator, Cloudflare DevRel'}
            avatar={'/img/avatars/yusuke.jpeg'}
            text={'Kysely is great. D1 will be great. This is great.'}
            tweetLink={
              'https://twitter.com/yusukebe/status/1581775103167066112'
            }
          />

          <TweetQuote
            authorName={'"pilcrow"'}
            authorTitle={'Lucia creator'}
            avatar={'/img/avatars/pilcrowonpaper.jpeg'}
            text={
              "Ok, so I'm not a big fan of Drizzle. I don't like how I have to import everything when declaring schemas and queries, and I just prefer the simplicity and the overall API of Kysely."
            }
            tweetLink={
              'https://twitter.com/pilcrowonpaper/status/1675135710981165057'
            }
          />

          <TweetQuote
            authorName={'Theo "t3dotgg" Browne'}
            authorTitle={'Uploadthing creator, Ping.gg CEO'}
            avatar={'/img/avatars/theo.jpeg'}
            tweetLink={'https://twitter.com/t3dotgg/status/1632949634728599552'}
            text={
              "Planetscale's DatabaseJS combined with Kysely or DrizzleORM is pretty dope to stay on edge"
            }
          />

          <TweetQuote
            authorName={'Nicholas Griffin'}
            authorTitle={'sqs-consumer maintainer, BBC SWE'}
            avatar={'/img/avatars/nicholas.jpeg'}
            text="I don't actually like prisma that much, I prefer Kysely, not an ORM though."
            tweetLink={
              'https://twitter.com/ngriffin_uk/status/1599891725404676096'
            }
          />

          <TweetQuote
            authorName={'Ross Coundon'}
            authorTitle={'leadent digital CTO'}
            avatar={'/img/avatars/ross.jpeg'}
            text={
              "I particularly like Kysely here, it's a type-safe query builder and as such doesn't enforce the specifics of an ORM on you, therefore I feel, in the medium-to-long term, it'll save you the time and effort of working around ORM-specific and enforced structures/approaches"
            }
            tweetLink={
              'https://twitter.com/rcoundon/status/1676244054109978624'
            }
          />

          <TweetQuote
            authorName={'Alberto "gimenete" Gimeno'}
            authorTitle={'Railway SWE'}
            avatar={'/img/avatars/alberto.jpeg'}
            tweetLink={
              'https://twitter.com/gimenete/status/1653121152854765569'
            }
            text={
              "I'm a happy Kysely user. It's great to see that the code I'm writing now can work with serverless PostgreSQL now!"
            }
          />

          <TweetQuote
            authorName={'Johan Eliasson'}
            authorTitle={'OneLab CTO'}
            avatar={'/img/avatars/johan.jpeg'}
            tweetLink={
              'https://twitter.com/elitasson/status/1642090379066449920'
            }
            text={
              "Instead of Prisma, I'm testing Kysely, Kysely Codegen, and Atlas. Works great."
            }
          />

          <TweetQuote
            authorName={'Mehul Mohan'}
            authorTitle={'Codedamn Founder'}
            avatar={'/img/avatars/mehul.jpeg'}
            text="We went with query builder because we did not have more time to waste on ORMs. ORMs might be great but we have the technical capability to pull off just using a query builder. However, we type safety and sanitization for DX and security was a must - hence Kysely."
            tweetLink={
              'https://twitter.com/mehulmpt/status/1650480912759685120'
            }
          />

          <TweetQuote
            authorName={'Sam Cook'}
            authorTitle={'Gamma.io SWE'}
            avatar={'/img/avatars/samcook.jpeg'}
            tweetLink={
              'https://twitter.com/sjc5_/status/1623210443874639873?ref_src=twsrc%5Etfw'
            }
            text={'Kysely is amazing.'}
          />

          <TweetQuote
            authorName={'Gannon Hall'}
            authorTitle={'Astro Labs Founder'}
            avatar={'/img/avatars/gannon.jpeg'}
            tweetLink={'https://twitter.com/gannonh/status/1653109305368018944'}
            text={
              'Vercel just announced native Postgres support and published Prisma and Kysely templates. I like the DX of Prisma and the type safety of Kysely so I use both via prisma-kysely.'
            }
          />

          <TweetQuote
            authorName={'Alisson "thelinuxlich" C.Agiani'}
            authorTitle="Opensourcerer"
            avatar={'/img/avatars/sommelier.jpeg'}
            tweetLink={
              'https://twitter.com/solinvictvs/status/1615549659115655169'
            }
            text={`Kysely is superior and with each release gets even more awesome`}
          />

          <TweetQuote
            authorName={'"Sock, the dev"'}
            authorTitle="Opensourcerer"
            avatar={'/img/avatars/sock.jpeg'}
            tweetLink="https://twitter.com/sockthedev/status/1599814152771760128"
            text="YES! Completed the initial version of this. Finally. Huge shoutout to Kysely for making this way less painful than it should have been. The BEST TypeScript based SQL query builder. ♥️"
          />

          <TweetQuote
            authorName={'"CodeMonument"'}
            authorTitle="Opensourcerer"
            avatar={'/img/avatars/codemonument.jpeg'}
            tweetLink={
              'https://twitter.com/CodeMonument/status/1571637269424996354'
            }
            text={`Deno + @planetscale/database + Kysely + kysely-planetscale is absolutely awesome! 

Knew nothing about the adapter and Kysely before and got the PoC in Code in 45 minutes. 
It's so stupidly simple! [...]
`}
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

function SectionDatabases() {
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
        <h1>It's all about the base</h1>
        <p>Kysely can communicate with these databases.</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          {[
            {
              name: 'PostgreSQL',
              logoURL:
                'https://cdn.iconscout.com/icon/free/png-256/free-postgresql-10-1175121.png',
              support: ['core', 'community'],
            },
            {
              name: 'MySQL',
              logoURL:
                'https://cdn.iconscout.com/icon/free/png-256/free-mysql-3521596-2945040.png?f=webp',
              support: ['core'],
            },
            {
              name: 'SQLite',
              logoURL:
                'https://api.nuget.org/v3-flatcontainer/sqlite.redist/3.8.4.2/icon',
              support: ['core', 'community'],
            },
            {
              name: 'AWS Aurora Serverless V1 Data API',
              logoURL:
                'https://lumigo.io/wp-content/uploads/2020/07/Amazon-Aurora@4x.png',
              support: ['community'],
            },
            {
              name: 'CockroachDB',
              logoURL:
                'https://qualified-production.s3.us-east-1.amazonaws.com/uploads/7e951840cd536c6bd529af6e5cc2c139b485f0ca0970710d2de7319682b82e11.png',
              support: ['core-ish', 'community'],
            },
            {
              name: 'SingleStore',
              logoURL:
                'https://images.credly.com/images/a3fd97f1-8f44-40d9-bbb7-980d1b0e7a04/blob.png',
              support: ['core', 'community'],
            },
            {
              name: 'Cloudflare D1',
              logo: (
                <div
                  style={{
                    display: 'flex',
                    color: '#F38020',
                    fill: '#F38020',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                >
                  <D1Logo />
                </div>
              ),
              support: ['community'],
            },
            {
              name: 'Vercel Postgres',
              logoURL:
                'https://vercel.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F1Q2R6J8jCobcgN0aPQku1H%2Fefb8f5a0cbe20c764db07cbb3e421f9c%2FDevice_Desktop__Theme_Dark__Type_Postgres.png&w=828&q=75&dpl=dpl_ZdcX8s834EPaer2gDhLUeWFVG47v',
              support: ['core', 'community'],
            },
            {
              name: 'YugabyteDB',
              logoURL: 'https://asset.brandfetch.io/idit3zjFwX/id7hZjM0Ny.png',
              support: ['core-ish', 'community'],
            },
            {
              name: 'MariaDB',
              logoURL:
                'https://gitlab.com/uploads/-/system/project/avatar/17486242/d8cef0f8-8a8f-4d8f-8efb-e6d40560fc82-mariadb.png',
              support: ['core-ish'],
            },
            {
              name: 'Supabase',
              logoURL:
                'https://loopgate.netlify.app/_next/image?url=%2Fimages%2Fmarquee%2Flogos%2Fsupabase.png&w=256&q=100',
              support: ['core', 'community'],
            },
            {
              name: 'PlanetScale',
              logoURL:
                'https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco,dpr_1/iidhf24ewhnqtjgrrfbp',
              support: ['core', 'community'],
            },
            {
              name: 'Materialize',
              logoURL:
                'https://assets.website-files.com/5d1126db676120bb4fe43762/63fd16d23c1e9bab4c1dc1e9_1367180373062805804ab5fa48e5e22cd908bd2c-250x250.png',
              support: ['core-ish', 'community'],
            },
            {
              name: 'Neon',
              logoURL: 'https://neon.tech/favicon/favicon-256x256.png',
              support: ['core', 'community'],
            },
            {
              name: 'Turso',
              logoURL:
                'https://miro.medium.com/v2/resize:fit:1080/1*HAWSb-VkjEPt2cyXl029eQ.png',
              support: ['community'],
            },
            {
              name: 'SurrealDB',
              logoURL:
                'https://surrealdb.com/static/img/home/logo@2x-1b3865ba0026de3b8308ecc3b5ef777d.png',
              support: ['community'],
            },
            {
              name: 'libSQL',
              logoURL: 'https://libsql.org/images/favicon/apple-touch-icon.png',
              support: ['community'],
            },
            {
              name: 'YDB',
              logoURL:
                'https://avatars.githubusercontent.com/u/88314308?s=200&v=4',
              support: ['community'],
            },
            {
              name: 'AWS S3 Select',
              logoURL:
                'https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/core-aws-services/store-and-retrieve-data-with-aws/images/d5d6add0a50dac23693532aec644c5a6_116-bb-1-a-4-0-a-0-d-46-b-2-863-f-1-d-8-a-362-a-3-c-12.png',
              support: ['community'],
            },
          ].map((db) => (
            <div
              style={{
                position: 'relative',
                flex: '0 1 100px',
                maxWidth: '100px',
                maxHeight: '144px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                background: 'var(--gray12)',
                padding: 16,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flex: '1',
                  height: '100%',
                  flexDirection: 'column',
                  justifyContent: 'space-around',
                }}
              >
                {db.logoURL ? (
                  <img
                    src={db.logoURL}
                    style={{
                      color: '#F38020',
                      fill: '#F38020',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                ) : (
                  db.logo
                )}
                <span style={{ height: '100%' }}></span>
                <span style={{ fontSize: '11px' }}>{db.name}</span>
                <span style={{ fontSize: '9px' }}>
                  {db.support.map((mode) => (
                    <span
                      style={{
                        color: {
                          core: 'lightgreen',
                          'core-ish': 'orange',
                          community: 'cyan',
                        }[mode],
                      }}
                    >
                      ✓
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: '30px',
            gap: '30px',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'lightgreen' }}>✓ core dialect</span>
          <span style={{ color: 'orange' }}>✓ core dialect /w caveats</span>
          <span style={{ color: 'cyan' }}>✓ community dialect</span>
        </div>
      </div>
    </section>
  )
}

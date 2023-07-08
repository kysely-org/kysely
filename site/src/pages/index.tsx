import React from 'react'
import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import { SectionFeatures } from '@site/src/components/SectionFeatures'

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

        <SectionQuotes />

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

function Quote({
  avatar,
  authorName,
  authorTitle,
  link,
  text,
}: {
  avatar: string
  link: string
  authorName: string
  authorTitle: string
  text: string
}) {
  return (
    <a
      href={link}
      target="_blank"
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
      {link.includes('twitter') ? <TwitterIcon /> : <DiscordIcon />}
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

function SectionQuotes() {
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
          <Quote
            authorName={'Lee "leerob" Robinson'}
            authorTitle={'Next.js comm lead, Vercel VP of DX'}
            avatar={'/img/avatars/leerob.jpeg'}
            link={'https://twitter.com/leeerob/status/1576929372811849730'}
            text={'Type-safe SQL queries with PlanetScale and Kysely 😍'}
          />

          <Quote
            authorName={'Orta Therox'}
            authorTitle={'Ex-TypeScript team'}
            avatar={'/img/avatars/orta.jpeg'}
            link={
              'https://discord.com/channels/890118421587578920/890118421587578925/1037692748825903114'
            }
            text={
              "👋 been using Kysely for a few days in Deno and Node, just wanted to say it's been going really well and it feels like a nice abstraction - kudos!"
            }
          />

          <Quote
            authorName={'Ben Holmes'}
            authorTitle={'Astro SWE'}
            avatar={'/img/avatars/benholmes.jpeg'}
            link={'https://twitter.com/BHolmesDev/status/1673715776946143233'}
            text={"Kysely I love you, but I still can't spell your name"}
          />

          <Quote
            authorName={'Julius Marminge'}
            authorTitle={'tRPC & create-t3-app core team'}
            avatar={'/img/avatars/julius.jpeg'}
            link={'https://twitter.com/jullerino/status/1676687249998598148'}
            text={
              'Utterly astounded by how Kysely manages to make all of this typesafe. Seems like no matter how complex you get, it can infer it correctly.'
            }
          />

          <Quote
            authorName={'Shoubhit "nexxel" Dash'}
            authorTitle={'create-t3-app creator'}
            avatar={'/img/avatars/nexxel.jpeg'}
            link={'https://twitter.com/nexxeln/status/1676975946606452737'}
            text={'kysely is great btw'}
          />

          <Quote
            authorName={'Dax "thdxr" Raad'}
            authorTitle={'SST core team'}
            avatar={'/img/avatars/daxraad.jpeg'}
            link={'https://twitter.com/thdxr/status/1623136475914043392'}
            text={"Kysely is the best written TS codebase I've ever seen"}
          />

          <Quote
            authorName={'Harminder Virk'}
            authorTitle={'AdonisJS creator'}
            avatar={'/img/avatars/harminder.jpeg'}
            link={'https://twitter.com/AmanVirk1/status/1666636685583568897'}
            text={
              'Kysely is great. Keeping an eye on it to see how it evolves in coming months'
            }
          />

          <Quote
            authorName={'Gal Schlezinger'}
            authorTitle={'fnm creator, Vercel SWE'}
            avatar={'/img/avatars/gal.jpeg'}
            text={'Kysely is 🐐'}
            link={'https://twitter.com/galstar/status/1645452990147436546'}
          />

          <Quote
            authorName={'Yusuke "yusukebe" Wada'}
            authorTitle={'Hono creator, Cloudflare DevRel'}
            avatar={'/img/avatars/yusuke.jpeg'}
            text={'Kysely is great. D1 will be great. This is great.'}
            link={'https://twitter.com/yusukebe/status/1581775103167066112'}
          />

          <Quote
            authorName={'"pilcrow"'}
            authorTitle={'Lucia creator'}
            avatar={'/img/avatars/pilcrowonpaper.jpeg'}
            text={
              "Ok, so I'm not a big fan of Drizzle. I don't like how I have to import everything when declaring schemas and queries, and I just prefer the simplicity and the overall API of Kysely."
            }
            link={
              'https://twitter.com/pilcrowonpaper/status/1675135710981165057'
            }
          />

          <Quote
            authorName={'Theo "t3dotgg" Browne'}
            authorTitle={'Uploadthing creator, Ping.gg CEO'}
            avatar={'/img/avatars/theo.jpeg'}
            link={'https://twitter.com/t3dotgg/status/1632949634728599552'}
            text={
              "Planetscale's DatabaseJS combined with Kysely or DrizzleORM is pretty dope to stay on edge"
            }
          />

          <Quote
            authorName={'Nicholas Griffin'}
            authorTitle={'sqs-consumer maintainer, BBC SWE'}
            avatar={'/img/avatars/nicholas.jpeg'}
            text="I don't actually like prisma that much, I prefer Kysely, not an ORM though."
            link={'https://twitter.com/ngriffin_uk/status/1599891725404676096'}
          />

          <Quote
            authorName={'R. Alex Anderson'}
            authorTitle={'Thorium Nova creator'}
            avatar={'/img/avatars/alexanderson.jpeg'}
            link={'https://twitter.com/ralex1993/status/1677632989260390403'}
            text={
              'Shout out to Kysely for adding extensive JSDoc comments above the methods. It makes it much easier to figure out how to use it the way I want without having to dig into the docs. (though the docs are vv good too)'
            }
          />

          <Quote
            authorName={'Ross Coundon'}
            authorTitle={'leadent digital CTO'}
            avatar={'/img/avatars/ross.jpeg'}
            text={
              "I particularly like Kysely here, it's a type-safe query builder and as such doesn't enforce the specifics of an ORM on you, therefore I feel, in the medium-to-long term, it'll save you the time and effort of working around ORM-specific and enforced structures/approaches"
            }
            link={'https://twitter.com/rcoundon/status/1676244054109978624'}
          />

          <Quote
            authorName={'Alberto "gimenete" Gimeno'}
            authorTitle={'Railway SWE'}
            avatar={'/img/avatars/alberto.jpeg'}
            link={'https://twitter.com/gimenete/status/1653121152854765569'}
            text={
              "I'm a happy Kysely user. It's great to see that the code I'm writing now can work with serverless PostgreSQL now!"
            }
          />

          <Quote
            authorName={'Johan Eliasson'}
            authorTitle={'OneLab CTO'}
            avatar={'/img/avatars/johan.jpeg'}
            link={'https://twitter.com/elitasson/status/1642090379066449920'}
            text={
              "Instead of Prisma, I'm testing Kysely, Kysely Codegen, and Atlas. Works great."
            }
          />

          <Quote
            authorName={'Mehul Mohan'}
            authorTitle={'Codedamn Founder'}
            avatar={'/img/avatars/mehul.jpeg'}
            text="We went with query builder because we did not have more time to waste on ORMs. ORMs might be great but we have the technical capability to pull off just using a query builder. However, we type safety and sanitization for DX and security was a must - hence Kysely."
            link={'https://twitter.com/mehulmpt/status/1650480912759685120'}
          />

          <Quote
            authorName={'Sam Cook'}
            authorTitle={'Gamma.io SWE'}
            avatar={'/img/avatars/samcook.jpeg'}
            link={'https://twitter.com/sjc5_/status/1623210443874639873'}
            text={'Kysely is amazing.'}
          />

          <Quote
            authorName={'Gannon Hall'}
            authorTitle={'Astro Labs Founder'}
            avatar={'/img/avatars/gannon.jpeg'}
            link={'https://twitter.com/gannonh/status/1653109305368018944'}
            text={
              'Vercel just announced native Postgres support and published Prisma and Kysely templates. I like the DX of Prisma and the type safety of Kysely so I use both via prisma-kysely.'
            }
          />

          <Quote
            authorName={'Alisson "thelinuxlich" C.Agiani'}
            authorTitle="Opensourcerer"
            avatar={'/img/avatars/sommelier.jpeg'}
            link={'https://twitter.com/solinvictvs/status/1615549659115655169'}
            text={
              'Kysely is superior and with each release gets even more awesome'
            }
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

function DiscordIcon() {
  return (
    <svg
      aria-hideen="true"
      viewBox="0 -28.5 256 256"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      style={{
        position: 'absolute',
        top: 18,
        right: 18,
        height: 20,
        width: 20,
      }}
    >
      <g>
        <path
          d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
          fill="#5865F2"
          fill-rule="nonzero"
        />
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

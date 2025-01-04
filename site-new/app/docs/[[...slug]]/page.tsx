import { source } from '@/lib/source'
import { DocsPage, DocsBody, DocsTitle } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { Callout } from 'fumadocs-ui/components/callout'

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: 'clerk' }}
      editOnGithub={{
        owner: 'kysely-org',
        repo: 'kysely',
        sha: 'main',
        path: `site/content/docs/${page.file.path}`,
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      {/* <DocsDescription>{page.data.description}</DocsDescription> */}
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents, Tab, Tabs, Callout }} />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}

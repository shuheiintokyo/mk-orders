import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHub, getSubPage } from "../../../lib/news";
import { Blocks } from "../../../components/NotionBlocks";
import { SiteError, SiteFooter, SiteHeader } from "../../../components/site";

export const revalidate = 1800; // re-read Notion at most every 30 minutes
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getSubPage((await params).slug).catch(() => null);
  return { title: page ? `${page.title} · MK Production` : "MK Production" };
}

export default async function NewsPage({ params }: Props) {
  const { slug } = await params;
  let page, hub;
  try {
    [page, hub] = await Promise.all([getSubPage(slug), getHub()]);
  } catch (e) {
    return (<><SiteHeader active="news" /><main className="wrap narrow"><SiteError message={(e as Error).message} /></main></>);
  }
  if (!page) notFound();
  const links = Object.fromEntries(hub.pages.map((p) => [p.id, p.slug]));
  return (
    <>
      <SiteHeader active="news" />
      <main className="wrap narrow site">
        <a href="/#news" className="eyebrow" style={{ textDecoration: "none" }}>← ホーム / Home</a>
        <h1 className="site-title"><span aria-hidden>{page.icon}</span> {page.title}</h1>
        <nav className="subnav">
          {hub.pages.map((p) => <a key={p.slug} className={`chip${p.slug === slug ? " on" : ""}`} href={`/news/${p.slug}`}>{p.icon} {p.title}</a>)}
        </nav>
        <Blocks blocks={page.blocks} links={links} />
      </main>
      <SiteFooter />
    </>
  );
}

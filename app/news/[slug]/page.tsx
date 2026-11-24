import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHub, getSubPage } from "../../../lib/news";
import { colorOf, shortDate, storiesOf } from "../../../lib/feed";
import { StoryRow } from "../../../components/stories";
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
    return (<div className="pop"><SiteHeader active="news" /><main className="wrap narrow"><SiteError message={(e as Error).message} /></main></div>);
  }
  if (!page) notFound();
  const links = Object.fromEntries(hub.pages.map((p) => [p.id, p.slug]));
  // News subjects show story cards grouped by day; the weekly roundup and the events log keep their Notion layout.
  const stories = /week|roundup|event|log|learn/i.test(page.title) ? [] : storiesOf(page.blocks);
  const days = [...new Set(stories.map((s) => s.date))];
  const intro = page.blocks.slice(0, Math.max(0, page.blocks.findIndex((b) => b.type === "heading_2")));
  return (
    <div className="pop" style={{ "--tc": colorOf(page.title) } as React.CSSProperties}>
      <SiteHeader active="news" />
      <main className="wrap narrow site">
        <a href="/#news" className="eyebrow" style={{ textDecoration: "none" }}>← ホーム / Home</a>
        <h1 className="site-title"><span aria-hidden>{page.icon}</span> {page.title}</h1>
        <nav className="subnav">
          {hub.pages.map((p) => <a key={p.slug} className={`chip${p.slug === slug ? " on" : ""}`} href={`/news/${p.slug}`}>{p.icon} {p.title}</a>)}
        </nav>
        {stories.length ? (
          <>
            <div className="topic-intro"><Blocks blocks={intro} links={links} /></div>
            {days.map((d) => (
              <section key={d} className="day">
                <h2><span className="day-dot" />{shortDate(d)} <small>{d}</small></h2>
                <div className="topic">{stories.filter((s) => s.date === d).map((s) => <StoryRow key={s.id} s={s} showDate={false} />)}</div>
              </section>
            ))}
          </>
        ) : <Blocks blocks={page.blocks} links={links} />}
      </main>
      <SiteFooter />
    </div>
  );
}

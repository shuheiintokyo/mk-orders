import type { Metadata } from "next";
import { getHub, getSubPage, latest } from "../lib/news";
import { Blocks, Rich } from "../components/NotionBlocks";
import { SiteError, SiteFooter, SiteHeader } from "../components/site";

export const revalidate = 1800; // re-read Notion at most every 30 minutes
export const metadata: Metadata = {
  title: "MK Production · 3Dプリント・ものづくり・AI",
  description: "Formlabs の光造形プリンターを動かしながら、3Dプリント・ものづくり・AI設計の世界のニュースを日本語でお届けします。",
};

export default async function Home() {
  let hub: Awaited<ReturnType<typeof getHub>>;
  try {
    hub = await getHub();
  } catch (e) {
    return (<><SiteHeader active="home" /><main className="wrap narrow"><SiteError message={(e as Error).message} /></main></>);
  }
  const links = Object.fromEntries(hub.pages.map((p) => [p.id, p.slug]));
  const subs = await Promise.all(hub.pages.map((p) => getSubPage(p.slug).catch(() => null)));
  const cards = Object.fromEntries(
    hub.pages.map((p, i) => {
      const l = subs[i] ? latest(subs[i]!.blocks) : null;
      return [p.slug, (
        <a key={p.slug} className="card news-card" href={`/news/${p.slug}`}>
          <div className="news-card-head"><span className="news-icon" aria-hidden>{p.icon}</span><h3>{p.title}</h3><span className="go">→</span></div>
          {l && <p className="eyebrow">{l.heading}</p>}
          {l?.items.length ? (
            <ul>{l.items.map((b) => <li key={b.id}><Rich rt={b.data.rich_text.filter((t: { annotations?: { bold?: boolean } }) => t.annotations?.bold)} /></li>)}</ul>
          ) : null}
        </a>
      )];
    }),
  );

  return (
    <>
      <SiteHeader active="home" />
      <main className="wrap narrow site">
        <h1 className="site-title">{hub.title}</h1>
        <Blocks blocks={hub.blocks} links={links} cards={cards} />
      </main>
      <SiteFooter />
    </>
  );
}

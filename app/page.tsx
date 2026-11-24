import type { Metadata } from "next";
import { getTopics, latestWeek, notesOf, shortDate, type Topic } from "../lib/feed";
import { PickCard, StoryRow } from "../components/stories";
import { SiteError, SiteFooter, SiteHeader } from "../components/site";

export const revalidate = 1800; // re-read Notion at most every 30 minutes
export const metadata: Metadata = {
  title: "MK Production · 3Dプリント・ものづくり・AI",
  description: "3Dプリント・ものづくり・AI設計の最新アップデートを、日本語の要約と出典つきで毎日お届けします。",
};

export default async function Home() {
  let topics: Topic[];
  try {
    topics = await getTopics();
  } catch (e) {
    return (<div className="pop"><SiteHeader active="home" /><main className="wrap narrow"><SiteError message={(e as Error).message} /></main></div>);
  }
  const news = topics.filter((t) => t.kind === "news");
  const weekly = topics.find((t) => t.kind === "weekly");
  const log = topics.find((t) => t.kind === "log");
  const week = weekly ? latestWeek(weekly.blocks) : null;
  const notes = log ? notesOf(log.blocks) : [];
  const picks = news.flatMap((t) => (t.stories[0] ? [{ s: t.stories[0], t }] : []));
  const newest = news.flatMap((t) => t.stories.map((s) => s.date)).filter((d) => /^\d{4}-/.test(d)).sort().pop();
  const total = news.reduce((n, t) => n + t.stories.length, 0);

  return (
    <div className="pop">
      <SiteHeader active="home" />
      <section className="hero">
        <div className="wrap">
          <span className="live"><i /> 毎日更新 · Updated daily{newest && <> · 最終更新 {shortDate(newest)}</>}</span>
          <h1>ものづくり × AI の<br />最新アップデート</h1>
          <p className="hero-en">Fresh updates on 3D printing, making and AI‑assisted design. Every story has a short Japanese summary and a link to its source.</p>
          <nav className="topic-chips" aria-label="トピック / Topics">
            {news.map((t) => <a key={t.slug} href={`#${t.slug}`} style={{ "--tc": t.color } as React.CSSProperties}>{t.icon} {t.label}<b>{t.stories.length}</b></a>)}
            {weekly && <a href={`/news/${weekly.slug}`} style={{ "--tc": weekly.color } as React.CSSProperties}>{weekly.icon} {weekly.label}</a>}
          </nav>
        </div>
      </section>

      <main className="wrap home" id="news">
        {picks.length > 0 && (
          <section>
            <div className="sec-head">
              <h2>今日のピックアップ <span>Top picks</span></h2>
              <p>各トピックのいちばん新しい話題 · The newest story in each topic</p>
            </div>
            <div className="picks">{picks.map(({ s, t }) => <PickCard key={s.id} s={s} t={t} />)}</div>
          </section>
        )}

        <section className="notes" style={{ "--tc": "#20B486" } as React.CSSProperties}>
          <div className="sec-head">
            <h2>学びノート <span>My notes</span></h2>
            <p>ニュースを見て、試して、気づいたこと · What I found interesting in AI, 3D printing and R&amp;D</p>
          </div>
          {notes.length ? (
            <div className="note-list">
              {notes.map((n) => (
                <a key={n.id} className="note" href={log ? `/news/${log.slug}` : "#"}>
                  <span className="note-pin" aria-hidden>📌</span>
                  <small className="note-meta">{n.date && shortDate(n.date)}{n.topic && <> · {n.topic}</>}</small>
                  <b>{n.title}</b>
                  {n.excerpt && <span>{n.excerpt}</span>}
                </a>
              ))}
            </div>
          ) : (
            <div className="note note-empty">
              <span className="note-pin" aria-hidden>✏️</span>
              <b>ノートは準備中です / Notes are on the way</b>
              <span>AI、3Dプリント、身の回りの研究開発（R&amp;D）について、面白いと思ったことをここに書いていきます。<br />I&apos;ll post short notes here on what I find interesting in AI, 3D printing and R&amp;D in Japan and around the world.</span>
            </div>
          )}
          {log && <a className="see-all" href={`/news/${log.slug}`}>ノートとイベントの記録を見る / All notes and events →</a>}
        </section>

        {week && weekly && (
          <a className="weekly" href={`/news/${weekly.slug}`}>
            <div className="weekly-head">
              <span className="tag">{weekly.icon} 週間まとめ · Weekly roundup</span>
              <h2>{week.heading.replace(/^Week of\s*/i, "")}</h2>
              <p>1週間の大事な話題をまとめて · The week&apos;s key stories in one place</p>
            </div>
            <div className="weekly-groups">
              {week.groups.slice(0, 3).map((g) => (
                <div key={g.title}><b>{g.title}</b><ul>{g.items.slice(0, 3).map((h) => <li key={h}>{h}</li>)}</ul></div>
              ))}
            </div>
            <span className="more">まとめを読む / Read the roundup →</span>
          </a>
        )}

        <section>
          <div className="sec-head">
            <h2>トピック別 <span>By topic</span></h2>
            <p>{total} 件の記事 · {total} stories, newest first</p>
          </div>
          <div className="topics">
            {news.map((t) => (
              <section key={t.slug} id={t.slug} className="topic" style={{ "--tc": t.color } as React.CSSProperties}>
                <header>
                  <span className="topic-icon" aria-hidden>{t.icon}</span>
                  <div><h3>{t.label}</h3><small>{t.title}</small></div>
                  <a href={`/news/${t.slug}`} className="see-all">すべて見る →</a>
                </header>
                {t.stories.length ? t.stories.slice(0, 4).map((s) => <StoryRow key={s.id} s={s} />) : <p className="muted">まだ記事がありません / No stories yet</p>}
              </section>
            ))}
          </div>
        </section>

        <section className="cta-row">
          <a className="cta" href="/contact" style={{ "--tc": "#FF5C7A" } as React.CSSProperties}>
            <span className="cta-icon">💬</span>
            <b>相談・プリントのご依頼</b>
            <span>作りたいもの、材料のことなど気軽にどうぞ。Formlabs で造形して国内発送します。<br /><em>Talk to us about a print or a material.</em></span>
            <span className="more">お問い合わせ →</span>
          </a>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

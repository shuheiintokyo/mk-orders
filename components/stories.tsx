import type { Story, Topic } from "../lib/feed";
import { shortDate } from "../lib/feed";

// Story cards for the public site. Every card says where the story came from.

export function SourceLine({ s }: { s: Story }) {
  if (!s.source && !s.url) return null;
  return (
    <span className="src">
      <span className="src-k">元記事 Original</span>
      <span className="src-v">{s.source || s.domain}</span>
      {s.domain && s.domain !== s.source && <span className="src-d">{s.domain}</span>}
      <LangBadge s={s} />
    </span>
  );
}

/** "📰 4社が報道": how many outlets covered the story (shown from 2). */
export function Coverage({ s }: { s: Story }) {
  if (s.sources < 2) return null;
  return <span className="cov" title={`${s.sources}つのメディアがこの話題を報じています / ${s.sources} outlets covered this story`}>📰 {s.sources}社が報道 · {s.sources} sources</span>;
}

/** Which language the original article is written in, e.g. "英語 EN". */
export function LangBadge({ s }: { s: Story }) {
  if (!s.lang) return null;
  return <span className="lang" title={`元記事は${s.lang.ja}です / The original article is in ${s.lang.code}`}>{s.lang.ja} {s.lang.code}</span>;
}

const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;
const OPEN_TITLE = "元記事を新しいタブで開きます / Opens the original article in a new tab";

/** "▶ 解説動画を見る": our YouTube episode that explains this story in more depth. */
export function DeepDive({ s }: { s: Story }) {
  if (!s.video) return null;
  return (
    <a className="deep" href={s.video.url} {...NEW_TAB} title={s.video.title}>
      <span aria-hidden>▶</span> 解説動画を見る <small>Watch the deep dive</small>
    </a>
  );
}

/** A big card for the front page picks. The whole card opens the original article. */
export function PickCard({ s, t }: { s: Story; t: Topic }) {
  return (
    <article className="pick" style={{ "--tc": t.color } as React.CSSProperties}>
      <div className="pick-top">
        <span className="tag">{t.icon} {t.label}</span>
        <span className="date">{shortDate(s.date)}</span>
      </div>
      <h3>{s.url ? <a className="stretch" href={s.url} {...NEW_TAB} title={OPEN_TITLE}>{s.headline}</a> : s.headline}</h3>
      <Coverage s={s} />
      {s.summary && <p>{s.summary}</p>}
      <DeepDive s={s} />
      <div className="pick-foot"><SourceLine s={s} />{s.url && <span className="read">元記事を読む ↗<small>Read the original</small></span>}</div>
    </article>
  );
}

/** A compact row for topic lists. The whole row opens the original article. */
export function StoryRow({ s, showDate = true }: { s: Story; showDate?: boolean }) {
  return (
    <div className="story-row">
      {showDate && <span className="row-date">{shortDate(s.date)}</span>}
      <span className="row-body">
        <strong>{s.url ? <a className="stretch" href={s.url} {...NEW_TAB} title={OPEN_TITLE}>{s.headline}</a> : s.headline}</strong>
        <Coverage s={s} />
        {s.summary && <span className="row-sum">{s.summary}</span>}
        <SourceLine s={s} />
        <DeepDive s={s} />
      </span>
      {s.url && <span className="row-go" aria-hidden>↗</span>}
    </div>
  );
}

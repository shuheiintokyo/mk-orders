import type { Story, Topic } from "../lib/feed";
import { shortDate } from "../lib/feed";

// Story cards for the public site. Every card says where the story came from.

export function SourceLine({ s }: { s: Story }) {
  if (!s.source && !s.url) return null;
  return (
    <span className="src">
      <span className="src-k">出典 Source</span>
      <span className="src-v">{s.source || s.domain}</span>
      {s.domain && s.domain !== s.source && <span className="src-d">{s.domain}</span>}
    </span>
  );
}

/** A big card for the front page picks. The whole card opens the original article. */
export function PickCard({ s, t }: { s: Story; t: Topic }) {
  const Tag = s.url ? "a" : "div";
  return (
    <Tag className="pick" style={{ "--tc": t.color } as React.CSSProperties} {...(s.url ? { href: s.url, target: "_blank", rel: "noopener noreferrer" } : {})}>
      <div className="pick-top">
        <span className="tag">{t.icon} {t.label}</span>
        <span className="date">{shortDate(s.date)}</span>
      </div>
      <h3>{s.headline}</h3>
      {s.summary && <p>{s.summary}</p>}
      <div className="pick-foot"><SourceLine s={s} />{s.url && <span className="read">読む ↗</span>}</div>
    </Tag>
  );
}

/** A compact row for topic lists. */
export function StoryRow({ s, showDate = true }: { s: Story; showDate?: boolean }) {
  const inner = (
    <>
      {showDate && <span className="row-date">{shortDate(s.date)}</span>}
      <span className="row-body">
        <strong>{s.headline}</strong>
        {s.summary && <span className="row-sum">{s.summary}</span>}
        <SourceLine s={s} />
      </span>
      {s.url && <span className="row-go" aria-hidden>↗</span>}
    </>
  );
  return s.url ? <a className="story-row" href={s.url} target="_blank" rel="noopener noreferrer">{inner}</a> : <div className="story-row">{inner}</div>;
}

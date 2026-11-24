import type { Block, RichText } from "../lib/news";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Notion page ids that have their own page on this site, mapped to their slug.
export type LinkMap = Record<string, string>;

function href(url: string, links: LinkMap) {
  const id = url.replace(/-/g, "").match(/[0-9a-f]{32}/)?.[0];
  if (id && links[id]) return `/news/${links[id]}`;
  const own = url.match(/^https?:\/\/(?:www\.)?mkproductionlab\.com(\/.*)?$/);
  if (own) return own[1] || "/"; // links to this site stay in the same tab
  if (url.startsWith("/")) return null; // a Notion page that is not public: show text only
  return url;
}

export function Rich({ rt = [], links = {} }: { rt?: RichText; links?: LinkMap }) {
  return (
    <>
      {rt.map((t: any, i: number) => {
        const a = t.annotations ?? {};
        let el: React.ReactNode = t.plain_text;
        if (t.type === "mention" && t.mention?.type === "page") {
          const to = href(t.mention.page.id, links);
          return to ? <a key={i} href={to}>{t.plain_text}</a> : null; // private pages are left out
        }
        if (a.code) el = <code>{el}</code>;
        if (a.bold) el = <strong>{el}</strong>;
        if (a.italic) el = <em>{el}</em>;
        if (a.strikethrough) el = <s>{el}</s>;
        if (a.underline) el = <u>{el}</u>;
        const to = t.href ? href(t.href, links) : null;
        if (to) {
          const ext = /^https?:/.test(to);
          el = <a href={to} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{el}</a>;
        }
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

// Group consecutive list items so they render inside one <ul>/<ol>.
function groups(list: Block[]) {
  const out: (Block | { type: "ul" | "ol"; id: string; items: Block[] })[] = [];
  for (const b of list) {
    const kind = b.type === "bulleted_list_item" || b.type === "to_do" ? "ul" : b.type === "numbered_list_item" ? "ol" : null;
    const last = out[out.length - 1] as any;
    if (kind && last?.type === kind) last.items.push(b);
    else if (kind) out.push({ type: kind, id: b.id, items: [b] });
    else out.push(b);
  }
  return out;
}

// cards: optional replacement for a child page link (the front page shows a preview card).
type Opts = { links?: LinkMap; cards?: Record<string, React.ReactNode> };

export function Blocks({ blocks, links = {}, cards }: { blocks: Block[] } & Opts) {
  return (
    <>
      {groups(blocks).map((g: any) => {
        if (g.type === "ul" || g.type === "ol") {
          const Tag = g.type;
          return (
            <Tag key={g.id} className={g.items[0].type === "to_do" ? "todo" : undefined}>
              {g.items.map((b: Block) => (
                <li key={b.id} className={b.type === "to_do" && b.data.checked ? "done" : undefined}>
                  <Rich rt={b.data.rich_text} links={links} />
                  {b.children.length > 0 && <Blocks blocks={b.children} links={links} />}
                </li>
              ))}
            </Tag>
          );
        }
        return <One key={g.id} b={g} links={links} cards={cards} />;
      })}
    </>
  );
}

function One({ b, links, cards }: { b: Block; links: LinkMap; cards?: Opts["cards"] }) {
  const d = b.data ?? {};
  switch (b.type) {
    case "paragraph":
      return d.rich_text?.length ? <p><Rich rt={d.rich_text} links={links} /></p> : null;
    case "heading_1":
      return <h2><Rich rt={d.rich_text} links={links} /></h2>;
    case "heading_2":
      return <h2 id={/news|ニュース/i.test(d.rich_text?.map((t: any) => t.plain_text).join("") ?? "") ? "news" : undefined}><Rich rt={d.rich_text} links={links} /></h2>;
    case "heading_3":
      return <h3><Rich rt={d.rich_text} links={links} /></h3>;
    case "quote":
      return <blockquote><Rich rt={d.rich_text} links={links} /></blockquote>;
    case "divider":
      return <hr />;
    case "callout":
      if (d.color === "gray_background") return null; // grey callouts are internal notes
      return (
        <div className="callout">
          {d.icon?.emoji && <span className="callout-icon" aria-hidden>{d.icon.emoji}</span>}
          <div>
            <p><Rich rt={d.rich_text} links={links} /></p>
            <Blocks blocks={b.children} links={links} />
          </div>
        </div>
      );
    case "column_list":
      return <div className="cols">{b.children.map((c) => <div key={c.id} className="col"><Blocks blocks={c.children} links={links} cards={cards} /></div>)}</div>;
    case "child_page": {
      const slug = links[b.id.replace(/-/g, "")];
      if (slug && cards?.[slug]) return <>{cards[slug]}</>;
      return slug ? <a className="page-link" href={`/news/${slug}`}>{d.title} →</a> : null;
    }
    case "image": {
      const src = d.type === "external" ? d.external?.url : d.file?.url;
      return src ? <figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={d.caption?.map((t: any) => t.plain_text).join("") ?? ""} loading="lazy" /></figure> : null;
    }
    case "bookmark":
    case "embed":
    case "link_preview":
      return d.url ? <p><a href={d.url} target="_blank" rel="noopener noreferrer">{d.url}</a></p> : null;
    default:
      return null; // toggles (internal notes), table of contents and other blocks are left out
  }
}

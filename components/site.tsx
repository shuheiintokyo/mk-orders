import { BrandMark } from "./ui";

export const SOCIAL = [
  { name: "X (Twitter)", url: "https://x.com/mkproductionlab" },
  { name: "Instagram", url: "https://www.instagram.com/mkproductionlab/" },
  { name: "Threads", url: "https://www.threads.net/@mkproductionlab" },
];

// Header and footer for the public website (front page and news pages).
export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="appbar">
      <div className="appbar-in">
        <a className="brand" href="/">
          <BrandMark />
          <span>MK Production<small>3Dプリント・ものづくり・AI</small></span>
        </a>
        <nav className="nav">
          <a className={active === "home" ? "on" : ""} href="/">🏠 <span>ホーム</span></a>
          <a className={active === "news" ? "on" : ""} href="/#news">📰 <span>ニュース</span></a>
          <a className={active === "contact" ? "on" : ""} href="/contact">✉️ <span>お問い合わせ</span></a>
          <a href="/orders" title="Production / order manager (login)">🔒 <span>制作管理</span></a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap narrow">
        <p>© MK Production · {SOCIAL.map((s, i) => <span key={s.name}>{i > 0 && " · "}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></span>)} · <a href="/contact">お問い合わせ / Contact</a></p>
        <p className="muted">内容は Notion から自動で更新されます / Content updates automatically from Notion. · <a href="/orders">制作管理 / Production (login)</a></p>
      </div>
    </footer>
  );
}

export function SiteError({ message }: { message: string }) {
  return (
    <div className="alert" role="alert">
      ページを読み込めませんでした / Could not load this page. <br />
      <small>{message}</small>
    </div>
  );
}

import { BrandMark } from "./ui";

export const SOCIAL = [
  { name: "X (Twitter)", url: "https://x.com/mkproductionlab" },
  { name: "Instagram", url: "https://www.instagram.com/mkproductionlab/" },
  { name: "Threads", url: "https://www.threads.net/@mkproductionlab" },
  { name: "YouTube", url: "https://www.youtube.com/@mkproductionlab" },
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
        </nav>
      </div>
    </header>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  YouTube: <><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></>,
  "X (Twitter)": <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" fill="currentColor" />,
  Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" /></>,
  Threads: <path d="M16.7 11.2c-.1-.1-.2-.1-.3-.2-.2-3-1.8-4.7-4.6-4.7-1.6 0-3 .7-3.8 2l1.5 1c.6-.9 1.5-1.1 2.3-1.1 1 0 1.7.3 2.1.9.3.4.5 1 .6 1.7-.8-.1-1.6-.2-2.5-.1-2.5.1-4.1 1.6-4 3.6.1 1 .6 1.9 1.4 2.4.7.5 1.6.7 2.5.6 1.2-.1 2.2-.5 2.9-1.4.5-.7.8-1.5 1-2.6.6.4 1 .8 1.3 1.4.5 1.1.5 2.9-.9 4.3-1.2 1.2-2.7 1.8-5 1.8-2.5 0-4.4-.8-5.6-2.4C4.4 17 3.8 14.8 3.8 12s.6-5 1.8-6.6C6.8 3.8 8.7 3 11.2 3c2.5 0 4.4.8 5.7 2.4.6.8 1.1 1.7 1.4 2.8l1.8-.5c-.4-1.4-1-2.6-1.8-3.6C16.7 2 14.3 1 11.2 1 8.1 1 5.7 2 4.1 4c-1.4 1.8-2.2 4.4-2.2 7.9s.7 6 2.2 7.9C5.7 21.9 8.1 23 11.2 23c2.8 0 4.7-.7 6.3-2.3 2.1-2.1 2-4.7 1.3-6.3-.5-1.1-1.3-2.1-2.1-2.6v-.6Zm-4.6 4.6c-1 .1-2.1-.4-2.1-1.4-.1-.7.5-1.5 2.2-1.6h.6c.6 0 1.2.1 1.8.2-.2 2.4-1.4 2.7-2.5 2.8Z" fill="currentColor" />,
};

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="follow">
          <div>
            <b>フォローして最新情報をチェック</b>
            <span>Follow @mkproductionlab for daily updates</span>
          </div>
          <div className="sns">
            {SOCIAL.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="sns-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>{ICONS[s.name]}</svg>{s.name.replace(" (Twitter)", "")}
              </a>
            ))}
          </div>
        </div>
        <p className="foot-note">💬 ご質問やコメントは各SNSのDMか<a href="/contact">お問い合わせフォーム</a>からどうぞ。このサイトは AI の機能を取り入れながら作っている途中のため、内容が意図どおりに表示されないことがあります。ご不便をおかけしたら申し訳ありません。<br />
          Questions or comments? Send a DM or use the <a href="/contact">contact form</a>. This site is still being built with AI features, so some content may not come out quite as intended. Sorry for any inconvenience.</p>
        <p className="foot-links">© MK Production · <a href="/contact">お問い合わせ / Contact</a></p>
      </div>
    </footer>
  );
}

/** Print orders are not open yet: the printer has not arrived in Kobe. */
export function NotOpenYet() {
  return (
    <div className="notice" role="note">
      <span className="notice-icon" aria-hidden>🖨️</span>
      <div>
        <b>プリントのご依頼はまだ受け付けていません</b>
        <span>神戸に置くプリンター（Formlabs Form Studio 1）の到着を待っているところです。届いて試し刷りが済んだら、ここと各SNSでお知らせします。ご相談やご質問はいつでも歓迎です。</span>
        <em>Print orders aren&apos;t open yet. We&apos;re waiting for our printer (a Formlabs Form Studio 1) to arrive in Kobe, and we&apos;ll announce it here and on social media once it&apos;s set up and tested. Questions and ideas are welcome anytime.</em>
      </div>
    </div>
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

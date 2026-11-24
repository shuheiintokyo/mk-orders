import type { Metadata } from "next";
import { ContactForm } from "../../components/ContactForm";
import { SiteFooter, SiteHeader, SOCIAL } from "../../components/site";

export const dynamic = "force-dynamic"; // reads WEB3FORMS_KEY at request time
export const metadata: Metadata = { title: "お問い合わせ / Contact · MK Production" };

export default function Contact() {
  const key = process.env.WEB3FORMS_KEY;
  return (
    <>
      <SiteHeader active="contact" />
      <main className="wrap narrow site">
        <a href="/" className="eyebrow" style={{ textDecoration: "none" }}>← ホーム / Home</a>
        <h1 className="site-title">お問い合わせ / Contact</h1>
        <p>作りたいもの、材料のこと、3Dプリントについての質問など、お気軽にどうぞ。SNSのDMでも受け付けています。<br />
          Questions about 3D printing, materials or something you&apos;d like to make are welcome. You can also send us a DM on social media.</p>
        {key ? <ContactForm accessKey={key} /> : (
          <div className="callout"><span className="callout-icon" aria-hidden>🛠️</span><div><p>フォームは準備中です。今はSNSのDMからご連絡ください。<br />The form is not ready yet. Please send us a DM on social media for now.</p></div></div>
        )}
        <div className="cols">
          {SOCIAL.map((s) => <div key={s.name} className="col"><p><strong>{s.name}</strong>{"\n"}<a href={s.url} target="_blank" rel="noopener noreferrer">@mkproductionlab</a></p></div>)}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

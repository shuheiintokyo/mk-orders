"use client";
import { useState } from "react";

// Sends the message through Web3Forms, which emails it to the address saved with the
// access key. The address itself never appears on this site.
export function ContactForm({ accessKey }: { accessKey: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return; // hidden field only bots fill in
    setState("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `MK Production お問い合わせ: ${data.name}`,
          from_name: "MK Production website",
          name: data.name,
          email: data.email,
          message: data.message,
        }),
      });
      const out = await res.json();
      if (!out.success) throw new Error(out.message);
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent")
    return (
      <div className="callout">
        <span className="callout-icon" aria-hidden>✅</span>
        <div><p><strong>送信しました。ありがとうございます！</strong> 内容を確認して、いただいたメールアドレスにお返事します。<br />Thank you, your message was sent. We'll reply to the email address you gave.</p></div>
      </div>
    );

  return (
    <form className="card contact-form" onSubmit={submit}>
      <label className="field">お名前 / Name
        <input name="name" required maxLength={100} autoComplete="name" />
      </label>
      <label className="field">メールアドレス / Email <span className="hint">お返事の送り先 / for our reply</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" />
      </label>
      <label className="field">内容 / Message
        <textarea name="message" required maxLength={5000} rows={6} placeholder="作りたいもの・用途・サイズなど / What you'd like to make, what it's for, size…" />
      </label>
      <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden />
      {state === "error" && <p className="err" role="alert">送信できませんでした。時間をおいてもう一度お試しいただくか、SNSのDMでご連絡ください。<br />Sorry, the message could not be sent. Please try again later or send us a DM on social media.</p>}
      <button className="btn primary" disabled={state === "sending"}>{state === "sending" ? "送信中… / Sending…" : "送信する / Send"}</button>
    </form>
  );
}

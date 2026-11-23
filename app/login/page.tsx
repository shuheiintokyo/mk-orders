"use client";
import { useState } from "react";
import { BrandMark } from "../../components/ui";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(data.error);
    window.location.href = data.role === "kobe" ? "/kobe" : "/";
  }
  return (
    <main className="login">
      <form className="card" onSubmit={submit}>
        <div className="brand"><BrandMark /><span>MK Production<small>3D print service</small></span></div>
        <h1>Welcome back</h1>
        <p className="muted" style={{ margin: "0 0 24px" }}>パスワードを入力してください</p>
        <label className="field">Password / パスワード
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary lg" style={{ marginTop: 20 }} disabled={busy || !pw}>{busy ? "…" : "Log in / ログイン"}</button>
      </form>
    </main>
  );
}

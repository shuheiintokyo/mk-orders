"use client";
import { useState } from "react";

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
    <main className="wrap" style={{ maxWidth: 380, paddingTop: 80 }}>
      <form className="card" onSubmit={submit}>
        <h1 style={{ marginTop: 0, fontSize: 22 }}>MK Production</h1>
        <label>Password / パスワード
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn primary big" style={{ marginTop: 14 }} disabled={busy || !pw}>{busy ? "…" : "Log in / ログイン"}</button>
      </form>
    </main>
  );
}

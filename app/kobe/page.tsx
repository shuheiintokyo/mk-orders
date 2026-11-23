"use client";
import { useEffect, useState } from "react";
import { api, logout, today } from "../../lib/client";
import { CARRIERS, Order, Status } from "../../lib/types";

const JP: Record<string, string> = { Agreed: "これから印刷", Printing: "印刷中", Finished: "完成・発送待ち", Shipped: "発送済み" };
const NEXT: Partial<Record<Status, { to: Status; label: string }>> = {
  Agreed: { to: "Printing", label: "印刷を開始した" },
  Printing: { to: "Finished", label: "洗浄・硬化まで完成した" },
  Finished: { to: "Shipped", label: "発送した" },
};

function Card({ o, onDone }: { o: Order; onDone: (o: Order) => void }) {
  const [mins, setMins] = useState("");
  const [carrier, setCarrier] = useState(o.carrier);
  const [tracking, setTracking] = useState(o.trackingNumber);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const next = NEXT[o.status];

  async function patch(body: Partial<Order>) {
    setBusy(true); setErr("");
    try { onDone(await api<Order>(`/api/orders/${o.id}`, { method: "PATCH", body })); setMins(""); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  const addMinutes = () => patch({ handsOnMinutes: (o.handsOnMinutes ?? 0) + Number(mins) });
  const advance = () => {
    if (!next) return;
    const body: Partial<Order> = { status: next.to };
    if (next.to === "Shipped") Object.assign(body, { carrier, trackingNumber: tracking, shippedDate: today() });
    patch(body);
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">MK-{o.number}</span><span className={`pill ${o.status}`}>{JP[o.status]}</span>
      </div>
      <h3>{o.title || "(名前なし)"}</h3>
      <div className="facts">
        <span className="muted">レジン</span><strong>{o.resin || "–"}</strong>
        <span className="muted">量</span><strong>{o.resinMl ? `${o.resinMl} ml` : "–"}</strong>
        <span className="muted">作業時間</span><strong>{o.handsOnMinutes ?? 0} 分</strong>
      </div>
      {o.notes && <p style={{ whiteSpace: "pre-wrap", background: "var(--bg)", padding: 10, borderRadius: 8 }}>{o.notes}</p>}

      <div className="row" style={{ margin: "10px 0" }}>
        <input type="number" inputMode="numeric" placeholder="作業した分数" value={mins} onChange={(e) => setMins(e.target.value)} style={{ flex: 1 }} />
        <button className="btn" onClick={addMinutes} disabled={busy || !Number(mins)}>＋ 時間を追加</button>
      </div>

      {o.status === "Finished" && (
        <div className="grid" style={{ marginBottom: 10 }}>
          <label>配送方法<select value={carrier} onChange={(e) => setCarrier(e.target.value)}><option value="">–</option>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>追跡番号<input value={tracking} onChange={(e) => setTracking(e.target.value)} inputMode="numeric" /></label>
        </div>
      )}
      {err && <p className="err">{err}</p>}
      {next && (
        <button className="btn primary big" onClick={advance} disabled={busy || (next.to === "Shipped" && !carrier)}>
          {busy ? "保存中…" : `✓ ${next.label}`}
        </button>
      )}
    </div>
  );
}

export default function Kobe() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [done, setDone] = useState<Order[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { api<Order[]>("/api/orders").then((all) => setOrders(all.filter((o) => ["Agreed", "Printing", "Finished"].includes(o.status)))).catch((e) => setErr(e.message)); }, []);

  const update = (u: Order) => {
    if (u.status === "Shipped") { setOrders((l) => l!.filter((o) => o.id !== u.id)); setDone((d) => [u, ...d]); }
    else setOrders((l) => l!.map((o) => (o.id === u.id ? { ...o, ...u } : o)));
  };
  const sorted = [...(orders ?? [])].sort((a, b) => (a.agreedDate ?? "9").localeCompare(b.agreedDate ?? "9"));

  return (
    <main className="wrap kobe">
      <div className="bar"><h1>神戸のやること</h1><button className="btn" onClick={logout}>ログアウト</button></div>
      {err && <p className="err">{err}</p>}
      {!orders && !err && <p className="muted">読み込み中…</p>}
      {orders && sorted.length === 0 && <div className="card"><h3>今はやることはありません 🎉</h3></div>}
      {sorted.map((o) => <Card key={o.id} o={o} onDone={update} />)}
      {done.map((o) => <div key={o.id} className="card muted">MK-{o.number} {o.title} — 発送済み ✓</div>)}
    </main>
  );
}

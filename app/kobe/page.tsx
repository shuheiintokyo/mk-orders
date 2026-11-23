"use client";
import { useEffect, useState } from "react";
import { api, logout, today } from "../../lib/client";
import { CARRIERS, Order, STATUSES, Status } from "../../lib/types";
import { BrandMark, StatusPill } from "../../components/ui";

const JP: Record<string, string> = { Agreed: "印刷待ち", Printing: "印刷中", Finished: "完成・発送待ち", Shipped: "発送済み" };
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

  const step = STATUSES.indexOf(o.status);
  return (
    <article className={`kcard s-${o.status}`}>
      <div className="kcard-top" />
      <div className="kcard-body">
        <div className="row spread"><span className="id">MK-{o.number}</span><StatusPill status={o.status} label={JP[o.status]} /></div>
        <h3>{o.title || "(名前なし)"}</h3>
        <div className="kprogress" aria-hidden>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
        <p className="muted" style={{ fontSize: 12, margin: "0 0 16px" }}>受注 → 印刷 → 完成 → 発送</p>
        <div className="kfacts">
          <div className="kfact"><div className="k">レジン</div><div className="v">{o.resin || "–"}</div></div>
          <div className="kfact"><div className="k">量</div><div className="v">{o.resinMl ? `${o.resinMl}ml` : "–"}</div></div>
          <div className="kfact"><div className="k">作業時間</div><div className="v">{o.handsOnMinutes ?? 0}分</div></div>
        </div>
        {o.notes && <div className="knote">{o.notes}</div>}

        <div className="kminutes">
          <input type="number" inputMode="numeric" placeholder="作業した分数を入力" value={mins} onChange={(e) => setMins(e.target.value)} aria-label="作業した分数" />
          <button className="btn" onClick={addMinutes} disabled={busy || !Number(mins)}>＋ 追加</button>
        </div>

        {o.status === "Finished" && (
          <div className="kship">
            <label className="field">配送方法<select value={carrier} onChange={(e) => setCarrier(e.target.value)}><option value="">選んでください</option>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="field">追跡番号<input value={tracking} onChange={(e) => setTracking(e.target.value)} inputMode="numeric" /></label>
          </div>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        {next && (
          <button className={`btn lg ${next.to === "Shipped" ? "success" : "primary"}`} onClick={advance} disabled={busy || (next.to === "Shipped" && !carrier)}>
            {busy ? "保存中…" : `✓ ${next.label}`}
          </button>
        )}
      </div>
    </article>
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
      <div className="row spread">
        <div className="brand"><BrandMark /><span>MK Production<small>神戸</small></span></div>
        <button className="btn ghost sm" onClick={logout}>ログアウト</button>
      </div>
      <div className="kobe-head">
        <h1>今日のやること</h1>
        <p>{orders ? (sorted.length ? `${sorted.length}件の注文があります` : "") : ""}</p>
      </div>
      {err && <div className="alert" role="alert">{err}</div>}
      {!orders && !err && [0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 18 }} />)}
      {orders && sorted.length === 0 && <div className="card empty"><div className="big">🎉</div>今はやることはありません</div>}
      {sorted.map((o) => <Card key={o.id} o={o} onDone={update} />)}
      {done.map((o) => <div key={o.id} className="kdone">✓ MK-{o.number} {o.title} を発送しました</div>)}
    </main>
  );
}

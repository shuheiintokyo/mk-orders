"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, logout } from "../lib/client";
import { Order, STATUSES, Status } from "../lib/types";
import { suggestedQuote, dataDeleteDate, yen } from "../lib/pricing";

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Status | "All" | "Open">("Open");
  const [q, setQ] = useState("");

  useEffect(() => { api<Order[]>("/api/orders").then(setOrders).catch((e) => setErr(e.message)); }, []);

  const shown = useMemo(() => (orders ?? []).filter((o) =>
    (tab === "All" || (tab === "Open" ? o.status !== "Shipped" : o.status === tab)) &&
    (!q || `${o.title} ${o.customer} ${o.number}`.toLowerCase().includes(q.toLowerCase()))
  ), [orders, tab, q]);

  const stats = useMemo(() => {
    const all = orders ?? [];
    const price = (o: Order) => o.finalPrice ?? suggestedQuote(o);
    const open = all.filter((o) => o.status !== "Shipped" && o.status !== "Estimate");
    const unpaid = all.filter((o) => !o.paid && o.status !== "Estimate");
    const t = new Date(); const soon = new Date(t.getTime() + 14 * 864e5).toISOString().slice(0, 10);
    const deleteSoon = all.filter((o) => { const d = dataDeleteDate(o.shippedDate); return d && d <= soon; });
    return { open: open.length, unpaid: unpaid.reduce((s, o) => s + price(o), 0), unpaidN: unpaid.length,
      paid: all.filter((o) => o.paid).reduce((s, o) => s + price(o), 0), deleteSoon: deleteSoon.length };
  }, [orders]);

  const count = (s: Status) => (orders ?? []).filter((o) => o.status === s).length;
  const open = (o: Order) => router.push(`/order?id=${o.id}`);

  return (
    <main className="wrap">
      <div className="bar">
        <h1>MK Orders</h1>
        <div className="row">
          <a className="btn" href="/kobe">Kobe to do</a>
          <a className="btn primary" href="/order">+ New order</a>
          <button className="btn" onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="stats">
        <div className="card stat"><div className="muted">In progress</div><div className="v">{stats.open}</div></div>
        <div className="card stat"><div className="muted">Unpaid ({stats.unpaidN})</div><div className="v">{yen(stats.unpaid)}</div></div>
        <div className="card stat"><div className="muted">Paid total</div><div className="v">{yen(stats.paid)}</div></div>
        <div className="card stat"><div className="muted">Delete files ≤ 14 days</div><div className="v">{stats.deleteSoon}</div></div>
      </div>

      <div className="tabs">
        {(["Open", ...STATUSES, "All"] as const).map((s) => (
          <button key={s} className={`tab ${tab === s ? "on" : ""}`} onClick={() => setTab(s)}>
            {s}{STATUSES.includes(s as Status) ? ` ${count(s as Status)}` : ""}
          </button>
        ))}
        <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 200, marginLeft: "auto" }} />
      </div>

      {err && <p className="err">{err}</p>}
      {!orders && !err && <p className="muted">Loading from Notion…</p>}
      {orders && shown.length === 0 && <p className="muted">No orders here.</p>}

      {shown.length > 0 && (
        <>
          <div className="card desktop-only" style={{ padding: 0, overflowX: "auto" }}>
            <table>
              <thead><tr>
                <th>#</th><th>Order</th><th>Customer</th><th>Status</th><th>Resin</th>
                <th className="num">Suggested</th><th className="num">Final</th><th>Paid</th><th>Delete files</th>
              </tr></thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id} className="click" onClick={() => open(o)}>
                    <td className="muted">MK-{o.number}</td>
                    <td>{o.title || <span className="muted">(untitled)</span>}</td>
                    <td>{o.customer}</td>
                    <td><span className={`pill ${o.status}`}>{o.status}</span></td>
                    <td>{o.resin}{o.resinMl ? ` · ${o.resinMl} ml` : ""}</td>
                    <td className="num">{yen(suggestedQuote(o))}</td>
                    <td className="num">{yen(o.finalPrice)}</td>
                    <td>{o.paid ? "✓" : ""}</td>
                    <td className="muted">{dataDeleteDate(o.shippedDate) ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only">
            {shown.map((o) => (
              <div key={o.id} className="card list-card" onClick={() => open(o)}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>MK-{o.number} {o.title}</strong><span className={`pill ${o.status}`}>{o.status}</span>
                </div>
                <div className="muted">{o.customer} · {yen(o.finalPrice ?? suggestedQuote(o))} {o.paid ? "· paid" : ""}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

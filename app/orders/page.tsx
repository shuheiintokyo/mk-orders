"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/client";
import { Order, STATUSES, Status } from "../../lib/types";
import { suggestedQuote, dataDeleteDate, yen } from "../../lib/pricing";
import { AppBar, SearchIcon, StatusPill } from "../../components/ui";

type Tab = Status | "All" | "Open";

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("Open");
  const [q, setQ] = useState("");

  useEffect(() => { api<Order[]>("/api/orders").then(setOrders).catch((e) => setErr(e.message)); }, []);

  const shown = useMemo(() => (orders ?? []).filter((o) =>
    (tab === "All" || (tab === "Open" ? o.status !== "Shipped" : o.status === tab)) &&
    (!q || `${o.title} ${o.customer} MK-${o.number}`.toLowerCase().includes(q.toLowerCase()))
  ), [orders, tab, q]);

  const stats = useMemo(() => {
    const all = orders ?? [];
    const price = (o: Order) => o.finalPrice ?? suggestedQuote(o);
    const unpaid = all.filter((o) => !o.paid && o.status !== "Estimate");
    const soon = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    return {
      open: all.filter((o) => ["Agreed", "Printing", "Finished"].includes(o.status)).length,
      estimates: all.filter((o) => o.status === "Estimate").length,
      unpaid: unpaid.reduce((s, o) => s + price(o), 0), unpaidN: unpaid.length,
      paid: all.filter((o) => o.paid).reduce((s, o) => s + price(o), 0),
      deleteSoon: all.filter((o) => { const d = dataDeleteDate(o.shippedDate); return d && d <= soon; }).length,
    };
  }, [orders]);

  const count = (t: Tab) => (orders ?? []).filter((o) => t === "All" || (t === "Open" ? o.status !== "Shipped" : o.status === t)).length;
  const open = (o: Order) => router.push(`/order?id=${o.id}`);

  return (
    <>
      <AppBar active="orders" />
      <main className="wrap">
        <div className="page-head">
          <div><div className="eyebrow">Admin</div><h1>Orders</h1></div>
          <a className="btn primary" href="/order">＋ New order</a>
        </div>

        <div className="stats">
          <div className="card stat"><div className="k">In progress</div><div className="v">{orders ? stats.open : "–"}</div><div className="muted" style={{ fontSize: 12 }}>{stats.estimates} {stats.estimates === 1 ? "estimate" : "estimates"} waiting</div></div>
          <div className="card stat warn"><div className="k">Unpaid · {stats.unpaidN}</div><div className="v">{orders ? yen(stats.unpaid) : "–"}</div></div>
          <div className="card stat"><div className="k">Paid total</div><div className="v">{orders ? yen(stats.paid) : "–"}</div></div>
          <div className={`card stat ${stats.deleteSoon ? "warn" : ""}`}><div className="k">Delete files soon</div><div className="v">{orders ? stats.deleteSoon : "–"}</div></div>
        </div>

        <div className="toolbar">
          <div className="seg" role="tablist">
            {(["Open", ...STATUSES, "All"] as Tab[]).map((s) => (
              <button key={s} role="tab" aria-selected={tab === s} className={tab === s ? "on" : ""} onClick={() => setTab(s)}>
                {s}<span className="count">{orders ? count(s) : ""}</span>
              </button>
            ))}
          </div>
          <label className="search"><span className="sr-only">Search</span><SearchIcon />
            <input placeholder="Search orders…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>

        {err && <div className="alert" role="alert">{err}</div>}
        {!orders && !err && <div>{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</div>}
        {orders && shown.length === 0 && (
          <div className="card empty"><div className="big">🗂️</div>No orders here yet.</div>
        )}

        {shown.length > 0 && (
          <>
            <div className="card flush desktop-only" style={{ overflowX: "auto" }}>
              <table>
                <thead><tr>
                  <th>Order</th><th>Customer</th><th>Status</th><th>Resin</th>
                  <th className="num">Suggested</th><th className="num">Final</th><th>Payment</th><th>Delete files</th>
                </tr></thead>
                <tbody>
                  {shown.map((o) => (
                    <tr key={o.id} className="click" onClick={() => open(o)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(o)}>
                      <td className="title-cell"><strong>{o.title || "Untitled"}</strong><span>MK-{o.number}</span></td>
                      <td>{o.customer || <span className="muted">–</span>}</td>
                      <td><StatusPill status={o.status} /></td>
                      <td>{o.resin || "–"}{o.resinMl ? <span className="muted"> · {o.resinMl} ml</span> : null}</td>
                      <td className="num muted">{yen(suggestedQuote(o))}</td>
                      <td className="num"><strong>{yen(o.finalPrice)}</strong></td>
                      <td>{o.paid ? <span className="paid-yes">✓ Paid</span> : o.status === "Estimate" ? <span className="paid-no">–</span> : <span className="paid-no">Unpaid</span>}</td>
                      <td className="muted tnum">{dataDeleteDate(o.shippedDate) ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-only">
              {shown.map((o) => (
                <a key={o.id} className="card list-card" href={`/order?id=${o.id}`}>
                  <div className="row spread"><span className="id">MK-{o.number}</span><StatusPill status={o.status} /></div>
                  <div className="t" style={{ margin: "6px 0 2px" }}>{o.title || "Untitled"}</div>
                  <div className="row spread muted" style={{ fontSize: 13 }}>
                    <span>{o.customer || "–"}</span>
                    <span className="tnum"><strong style={{ color: "var(--ink)" }}>{yen(o.finalPrice ?? suggestedQuote(o))}</strong>{o.paid ? " · ✓" : ""}</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

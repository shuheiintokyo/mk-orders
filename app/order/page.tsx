"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, today } from "../../lib/client";
import { CARRIERS, Order, PAYMENT_METHODS, RESINS, STATUSES, Status } from "../../lib/types";
import { dataDeleteDate, HYOGO_MIN_WAGE, laborCost, materialCost, suggestedQuote, yen } from "../../lib/pricing";
import { AppBar, StatusPill } from "../../components/ui";

const blank: Partial<Order> = { title: "", status: "Estimate", yenPerMl: 10, paid: false, quotedDate: today() };

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="field"><span className="lbl">{label}{hint && <span className="hint">{hint}</span>}</span>{children}</label>;
}

function Editor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const [o, setO] = useState<Partial<Order> | null>(id ? null : blank);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (id) api<Order>(`/api/orders/${id}`).then(setO).catch((e) => setErr(e.message)); }, [id]);
  if (!o) return (<><AppBar active="orders" /><main className="wrap narrow">{err ? <div className="alert">{err}</div> : [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}</main></>);

  const set = <K extends keyof Order>(k: K, v: Order[K] | null) => { setSaved(false); setO((p) => ({ ...p, [k]: v })); };
  const numIn = (k: keyof Order) => ({
    type: "number", inputMode: "decimal" as const, value: (o[k] as number | null | undefined) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value === "" ? null : (Number(e.target.value) as never)),
  });
  const txt = (k: keyof Order) => ({ value: (o[k] as string | null | undefined) ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, (e.target.value || null) as never) });

  function setStatus(s: Status) {
    const patch: Partial<Order> = { status: s };
    if (s === "Agreed" && !o!.agreedDate) patch.agreedDate = today();
    if (s === "Shipped" && !o!.shippedDate) patch.shippedDate = today();
    setSaved(false); setO((p) => ({ ...p, ...patch }));
  }

  async function save() {
    setSaving(true); setErr("");
    try {
      const res = id ? await api<Order>(`/api/orders/${id}`, { method: "PATCH", body: o })
                     : await api<Order>("/api/orders", { method: "POST", body: o });
      setO(res); setSaved(true);
      if (!id) router.replace(`/order?id=${res.id}`);
    } catch (e) { setErr((e as Error).message); }
    setSaving(false);
  }

  const q = suggestedQuote(o);
  const idx = STATUSES.indexOf((o.status ?? "Estimate") as Status);
  const saveBtn = <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}</button>;

  return (
    <>
      <AppBar active="orders" />
      <main className="wrap narrow">
        <div className="page-head">
          <div>
            <a href="/orders" className="eyebrow" style={{ textDecoration: "none" }}>← All orders</a>
            <h1>{id ? (o.title || "Untitled") : "New order"}</h1>
            {id && <div className="row" style={{ marginTop: 6 }}><span className="id">MK-{o.number}</span><StatusPill status={(o.status ?? "Estimate") as Status} /></div>}
          </div>
          <div className="row">
            {o.url && <a className="btn" href={o.url} target="_blank" rel="noreferrer">Open in Notion ↗</a>}
            {saveBtn}
          </div>
        </div>
        {err && <div className="alert" role="alert">{err}</div>}

        <div className="stack">
          <section className="card">
            <h2 className="section-title"><span className="n">1</span>Order & status</h2>
            <F label="Order name"><input {...txt("title")} placeholder="e.g. Tanaka figure base" /></F>
            <div className="stepper" style={{ marginTop: 16 }} role="radiogroup" aria-label="Status">
              {STATUSES.map((s, i) => (
                <button key={s} role="radio" aria-checked={o.status === s} className={`step s-${s} ${i < idx ? "done" : ""} ${o.status === s ? "on" : ""}`} onClick={() => setStatus(s)}>
                  <span className="bar" />{s}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="section-title"><span className="n">2</span>Quote</h2>
            <div className="grid">
              <F label="Resin"><select {...txt("resin")}><option value="">Choose…</option>{RESINS.map((r) => <option key={r}>{r}</option>)}</select></F>
              <F label="Resin ml" hint="From PreForm"><input {...numIn("resinMl")} /></F>
              <F label="Yen per ml" hint="Default 10"><input {...numIn("yenPerMl")} placeholder="10" /></F>
              <F label="Hands-on minutes" hint="Kobe work time"><input {...numIn("handsOnMinutes")} /></F>
              <F label="Shipping yen"><input {...numIn("shippingYen")} /></F>
              <F label="Carrier"><select {...txt("carrier")}><option value="">Choose…</option>{CARRIERS.map((r) => <option key={r}>{r}</option>)}</select></F>
            </div>
            <div className="quote">
              <div><div className="k">Suggested quote</div><div className="amount">{yen(q)}</div></div>
              <div className="breakdown">
                <span>Material <b>{yen(materialCost(o))}</b></span>
                <span>Labour <b>{yen(laborCost(o))}</b> <span className="muted">(¥{HYOGO_MIN_WAGE.toLocaleString()}/h)</span></span>
                <span>Shipping <b>{yen(o.shippingYen ?? 0)}</b></span>
                <span className="muted">Rounded up to ¥100</span>
              </div>
              <button className="btn" onClick={() => set("finalPrice", q)} disabled={!q}>Use as final price</button>
            </div>
          </section>

          <section className="card">
            <h2 className="section-title"><span className="n">3</span>Customer & payment</h2>
            <div className="grid">
              <F label="Customer"><input {...txt("customer")} /></F>
              <F label="Customer email"><input type="email" {...txt("customerEmail")} /></F>
              <F label="Model files link" hint="Google Drive folder"><input type="url" {...txt("modelFiles")} placeholder="https://drive.google.com/…" /></F>
              <F label="Final price (yen)"><input {...numIn("finalPrice")} /></F>
              <F label="Payment method"><select {...txt("paymentMethod")}><option value="">Choose…</option>{PAYMENT_METHODS.map((r) => <option key={r}>{r}</option>)}</select></F>
              <label className="field check"><input type="checkbox" checked={!!o.paid} onChange={(e) => set("paid", e.target.checked)} />Paid</label>
            </div>
            {o.modelFiles && <div className="meta-line"><a className="chip" href={o.modelFiles} target="_blank" rel="noreferrer">📁 Open model files ↗</a></div>}
          </section>

          <section className="card">
            <h2 className="section-title"><span className="n">4</span>Dates & shipping</h2>
            <div className="grid">
              <F label="Quoted date"><input type="date" {...txt("quotedDate")} /></F>
              <F label="Agreed date"><input type="date" {...txt("agreedDate")} /></F>
              <F label="Shipped date"><input type="date" {...txt("shippedDate")} /></F>
              <F label="Tracking number"><input {...txt("trackingNumber")} /></F>
            </div>
            <div className="meta-line">
              <span className="chip">🗑️ Delete customer files on <b style={{ color: "var(--ink)" }}>{dataDeleteDate(o.shippedDate ?? null) ?? "shipped date + 90 days"}</b></span>
            </div>
          </section>

          <section className="card">
            <h2 className="section-title"><span className="n">5</span>Notes for Kobe</h2>
            <textarea {...txt("notes")} placeholder="Shown on the Kobe to do page, e.g. sand the support marks carefully" />
          </section>
        </div>

        <div className="savebar">{saveBtn}</div>
      </main>
    </>
  );
}

export default function Page() { return <Suspense><Editor /></Suspense>; }

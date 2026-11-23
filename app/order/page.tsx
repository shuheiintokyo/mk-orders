"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, today } from "../../lib/client";
import { CARRIERS, Order, PAYMENT_METHODS, RESINS, STATUSES, Status } from "../../lib/types";
import { dataDeleteDate, HYOGO_MIN_WAGE, laborCost, materialCost, suggestedQuote, yen } from "../../lib/pricing";

const blank: Partial<Order> = { title: "", status: "Estimate", yenPerMl: 10, paid: false, quotedDate: today() };

function Editor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const [o, setO] = useState<Partial<Order> | null>(id ? null : blank);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (id) api<Order>(`/api/orders/${id}`).then(setO).catch((e) => setErr(e.message)); }, [id]);
  if (!o) return <main className="wrap"><p className="muted">{err || "Loading…"}</p></main>;

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
  return (
    <main className="wrap" style={{ maxWidth: 860 }}>
      <div className="bar">
        <div className="row"><a className="btn" href="/">← Orders</a><h1>{id ? `MK-${o.number ?? ""}` : "New order"}</h1></div>
        <div className="row">
          {o.url && <a className="btn" href={o.url} target="_blank" rel="noreferrer">Open in Notion</a>}
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : saved ? "Saved ✓" : "Save"}</button>
        </div>
      </div>
      {err && <p className="err">{err}</p>}

      <div className="card">
        <label>Order name<input {...txt("title")} placeholder="e.g. Tanaka figure base" /></label>
        <div className="tabs" style={{ marginTop: 12 }}>
          {STATUSES.map((s) => <button key={s} className={`tab ${o.status === s ? "on" : ""}`} onClick={() => setStatus(s)}>{s}</button>)}
        </div>
      </div>

      <div className="card section">
        <h2>Quote</h2>
        <div className="grid">
          <label>Resin<select {...txt("resin")}><option value="">–</option>{RESINS.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>Resin ml (from PreForm)<input {...numIn("resinMl")} /></label>
          <label>Yen per ml (default 10)<input {...numIn("yenPerMl")} placeholder="10" /></label>
          <label>Hands-on minutes (Kobe)<input {...numIn("handsOnMinutes")} /></label>
          <label>Shipping yen<input {...numIn("shippingYen")} /></label>
          <label>Carrier<select {...txt("carrier")}><option value="">–</option>{CARRIERS.map((r) => <option key={r}>{r}</option>)}</select></label>
        </div>
        <div className="quote section">
          <div><div className="muted">Suggested quote</div><div className="big">{yen(q)}</div></div>
          <div className="muted">Material {yen(materialCost(o))} + labour {yen(laborCost(o))} (¥{HYOGO_MIN_WAGE}/h) + shipping {yen(o.shippingYen ?? 0)}, rounded up to ¥100</div>
          <button className="btn" onClick={() => set("finalPrice", q)} disabled={!q}>Use as final price</button>
        </div>
      </div>

      <div className="card section">
        <h2>Customer & payment</h2>
        <div className="grid">
          <label>Customer<input {...txt("customer")} /></label>
          <label>Customer email<input type="email" {...txt("customerEmail")} /></label>
          <label>Model files link<input type="url" {...txt("modelFiles")} placeholder="Google Drive folder" /></label>
          <label>Final price (yen)<input {...numIn("finalPrice")} /></label>
          <label>Payment method<select {...txt("paymentMethod")}><option value="">–</option>{PAYMENT_METHODS.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22 }}>
            <input type="checkbox" checked={!!o.paid} onChange={(e) => set("paid", e.target.checked)} /> Paid
          </label>
        </div>
        {o.modelFiles && <p><a href={o.modelFiles} target="_blank" rel="noreferrer">Open model files ↗</a></p>}
      </div>

      <div className="card section">
        <h2>Dates & shipping</h2>
        <div className="grid">
          <label>Quoted date<input type="date" {...txt("quotedDate")} /></label>
          <label>Agreed date<input type="date" {...txt("agreedDate")} /></label>
          <label>Shipped date<input type="date" {...txt("shippedDate")} /></label>
          <label>Tracking number<input {...txt("trackingNumber")} /></label>
        </div>
        <p className="muted">Data delete date: <strong>{dataDeleteDate(o.shippedDate ?? null) ?? "set when shipped (+90 days)"}</strong></p>
      </div>

      <div className="card section">
        <h2>Notes</h2>
        <textarea {...txt("notes")} placeholder="Notes for Kobe show on their to do page" />
      </div>
      <div className="row section" style={{ justifyContent: "flex-end" }}>
        <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : saved ? "Saved ✓" : "Save"}</button>
      </div>
    </main>
  );
}

export default function Page() { return <Suspense><Editor /></Suspense>; }

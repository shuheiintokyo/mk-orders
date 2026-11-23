import "server-only";
import { Order, STATUSES, Status } from "./types";

const API = process.env.NOTION_API_URL ?? "https://api.notion.com/v1"; // override only for local testing
const VERSION = "2025-09-03";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

async function notion(path: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(API + path, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${env("NOTION_TOKEN")}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json();
  if (res.status === 404 || res.status === 401)
    throw new Error("Notion can't see MK Orders. In Notion open MK Orders > ••• > Connections and add the \"MK Orders app\" integration, then reload.");
  if (!res.ok) throw new Error(`Notion ${res.status}: ${data?.message ?? "request failed"}`);
  return data;
}

// ---------- Notion page -> Order ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
const text = (p: any) => (p?.rich_text ?? p?.title ?? []).map((t: any) => t.plain_text).join("");
const n = (p: any) => (typeof p?.number === "number" ? p.number : null);
const sel = (p: any) => p?.select?.name ?? "";
const date = (p: any) => p?.date?.start ?? null;

export function toOrder(page: any): Order {
  const p = page.properties;
  const status = p["Status"]?.status?.name as Status;
  return {
    id: page.id,
    number: p["Order ID"]?.unique_id?.number ?? null,
    url: page.url,
    title: text(p["Order"]),
    status: STATUSES.includes(status) ? status : "Estimate",
    customer: text(p["Customer"]),
    customerEmail: p["Customer email"]?.email ?? "",
    modelFiles: p["Model files"]?.url ?? "",
    resin: sel(p["Resin"]),
    resinMl: n(p["Resin ml"]),
    yenPerMl: n(p["Yen per ml"]),
    handsOnMinutes: n(p["Hands-on minutes"]),
    shippingYen: n(p["Shipping yen"]),
    carrier: sel(p["Carrier"]),
    finalPrice: n(p["Final price"]),
    paid: !!p["Paid"]?.checkbox,
    paymentMethod: sel(p["Payment method"]),
    trackingNumber: text(p["Tracking number"]),
    notes: text(p["Notes"]),
    quotedDate: date(p["Quoted date"]),
    agreedDate: date(p["Agreed date"]),
    shippedDate: date(p["Shipped date"]),
  };
}

// ---------- Order fields -> Notion properties ----------
const rt = (s: string) => ({ rich_text: s ? [{ text: { content: s.slice(0, 2000) } }] : [] });
const numP = (v: unknown) => ({ number: v === "" || v == null || isNaN(Number(v)) ? null : Number(v) });
const selP = (s: string) => ({ select: s ? { name: s } : null });
const dateP = (s: string | null) => ({ date: s ? { start: s } : null });

const MAP: Partial<Record<keyof Order, (v: any) => [string, unknown]>> = {
  title: (v) => ["Order", { title: v ? [{ text: { content: v } }] : [] }],
  status: (v) => ["Status", { status: { name: v } }],
  customer: (v) => ["Customer", rt(v ?? "")],
  customerEmail: (v) => ["Customer email", { email: v || null }],
  modelFiles: (v) => ["Model files", { url: v || null }],
  resin: (v) => ["Resin", selP(v ?? "")],
  resinMl: (v) => ["Resin ml", numP(v)],
  yenPerMl: (v) => ["Yen per ml", numP(v)],
  handsOnMinutes: (v) => ["Hands-on minutes", numP(v)],
  shippingYen: (v) => ["Shipping yen", numP(v)],
  carrier: (v) => ["Carrier", selP(v ?? "")],
  finalPrice: (v) => ["Final price", numP(v)],
  paid: (v) => ["Paid", { checkbox: !!v }],
  paymentMethod: (v) => ["Payment method", selP(v ?? "")],
  trackingNumber: (v) => ["Tracking number", rt(v ?? "")],
  notes: (v) => ["Notes", rt(v ?? "")],
  quotedDate: (v) => ["Quoted date", dateP(v)],
  agreedDate: (v) => ["Agreed date", dateP(v)],
  shippedDate: (v) => ["Shipped date", dateP(v)],
};

export function toProperties(fields: Partial<Order>) {
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    const f = MAP[k as keyof Order];
    if (!f) continue;
    if (k === "status" && !STATUSES.includes(v as Status)) continue;
    const [name, value] = f(v);
    props[name] = value;
  }
  return props;
}

// ---------- Operations ----------
export async function listOrders(statuses?: Status[]): Promise<Order[]> {
  const filter = statuses?.length
    ? { or: statuses.map((s) => ({ property: "Status", status: { equals: s } })) }
    : undefined;
  const out: Order[] = [];
  let cursor: string | undefined;
  do {
    const data = await notion(`/data_sources/${env("NOTION_DATA_SOURCE_ID")}/query`, {
      method: "POST",
      body: {
        page_size: 100,
        start_cursor: cursor,
        filter,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      },
    });
    out.push(...data.results.map(toOrder));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return out;
}

export async function getOrder(id: string) {
  return toOrder(await notion(`/pages/${encodeURIComponent(id)}`));
}

export async function createOrder(fields: Partial<Order>) {
  const page = await notion(`/pages`, {
    method: "POST",
    body: {
      parent: { type: "data_source_id", data_source_id: env("NOTION_DATA_SOURCE_ID") },
      properties: toProperties(fields),
    },
  });
  return toOrder(page);
}

export async function updateOrder(id: string, fields: Partial<Order>) {
  const page = await notion(`/pages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { properties: toProperties(fields) },
  });
  return toOrder(page);
}

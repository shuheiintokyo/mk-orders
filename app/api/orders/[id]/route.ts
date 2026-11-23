import { NextResponse } from "next/server";
import { currentRole } from "../../../../lib/auth";
import { getOrder, updateOrder } from "../../../../lib/notion";
import { forKobe, KOBE_FIELDS, KOBE_STATUSES, Order } from "../../../../lib/types";

type Ctx = { params: Promise<{ id: string }> };
const fail = (e: unknown) => NextResponse.json({ error: (e as Error).message }, { status: 500 });

export async function GET(_req: Request, { params }: Ctx) {
  if ((await currentRole()) !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try { return NextResponse.json(await getOrder((await params).id)); } catch (e) { return fail(e); }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const { id } = await params;
  try {
    let fields = (await req.json()) as Partial<Order>;
    if (role === "kobe") {
      // Kobe can only move its own orders forward and fill in printing/shipping details.
      const current = await getOrder(id);
      if (!KOBE_STATUSES.includes(current.status)) return NextResponse.json({ error: "Not a Kobe order" }, { status: 403 });
      if (fields.status && !["Printing", "Finished", "Shipped"].includes(fields.status))
        return NextResponse.json({ error: "Status not allowed" }, { status: 403 });
      fields = Object.fromEntries(Object.entries(fields).filter(([k]) => KOBE_FIELDS.includes(k as keyof Order)));
    }
    const updated = await updateOrder(id, fields);
    return NextResponse.json(role === "kobe" ? forKobe(updated) : updated);
  } catch (e) { return fail(e); }
}

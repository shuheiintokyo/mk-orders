import { NextResponse } from "next/server";
import { currentRole } from "../../../lib/auth";
import { createOrder, listOrders } from "../../../lib/notion";
import { forKobe, KOBE_STATUSES, Order } from "../../../lib/types";

const fail = (e: unknown) => NextResponse.json({ error: (e as Error).message }, { status: 500 });

export async function GET() {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  try {
    const orders = await listOrders(role === "kobe" ? KOBE_STATUSES : undefined);
    if (role === "kobe") {
      return NextResponse.json(orders.map(forKobe));
    }
    return NextResponse.json(orders);
  } catch (e) { return fail(e); }
}

export async function POST(req: Request) {
  if ((await currentRole()) !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    const body = (await req.json()) as Partial<Order>;
    return NextResponse.json(await createOrder(body));
  } catch (e) { return fail(e); }
}

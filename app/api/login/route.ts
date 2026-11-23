import { NextResponse } from "next/server";
import { COOKIE, makeToken, roleForPassword } from "../../../lib/session";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  await new Promise((r) => setTimeout(r, 400)); // slow down guessing
  const role = roleForPassword(String(password ?? ""));
  if (!role) return NextResponse.json({ error: "Wrong password / パスワードが違います" }, { status: 401 });
  const { value, maxAge } = await makeToken(role);
  const res = NextResponse.json({ role });
  res.cookies.set(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
  return res;
}

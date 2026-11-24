import { NextRequest, NextResponse } from "next/server";
import { COOKIE, readToken } from "./lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();
  // Public website: the front page and the news pages need no login.
  if (pathname === "/" || pathname === "/news" || pathname.startsWith("/news/")) return NextResponse.next();

  const role = await readToken(req.cookies.get(COOKIE)?.value);
  if (!role) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // Kobe login only sees the Kobe to do page (and its API calls).
  if (role === "kobe" && !pathname.startsWith("/kobe") && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/kobe", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/|favicon|icon).*)"] };

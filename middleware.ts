import { NextRequest, NextResponse } from "next/server";
import { COOKIE, readToken } from "./lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The admin pages are not linked from the public site; keep them out of search engines too.
  if (pathname === "/login" || pathname === "/api/login") return noindex(NextResponse.next());
  // Public website: the front page and the news pages need no login.
  if (pathname === "/" || pathname === "/contact" || pathname === "/news" || pathname.startsWith("/news/")) return NextResponse.next();
  // Social: the news card image must be public (Instagram fetches it); the daily post route checks
  // the cron secret or the admin login itself.
  if (pathname === "/api/social/card" || pathname === "/api/social/post") return NextResponse.next();

  const role = await readToken(req.cookies.get(COOKIE)?.value);
  if (!role) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    return noindex(NextResponse.redirect(new URL("/login", req.url)));
  }
  // Kobe login only sees the Kobe to do page (and its API calls).
  if (role === "kobe" && !pathname.startsWith("/kobe") && !pathname.startsWith("/api/")) {
    return noindex(NextResponse.redirect(new URL("/kobe", req.url)));
  }
  return noindex(NextResponse.next());
}

function noindex(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/((?!_next/|favicon|icon|apple-icon).*)"] };

// Tiny signed-cookie login. Works in middleware (Edge) and route handlers.
import { Role } from "./types";

export const COOKIE = "mk_session";
const MAX_AGE_DAYS = 30;
const enc = new TextEncoder();

async function hmac(data: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET must be at least 16 characters");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]!);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function makeToken(role: Role) {
  const exp = Date.now() + MAX_AGE_DAYS * 864e5;
  const body = `${role}.${exp}`;
  return { value: `${body}.${await hmac(body)}`, maxAge: MAX_AGE_DAYS * 86400 };
}

export async function readToken(value: string | undefined): Promise<Role | null> {
  if (!value) return null;
  const [role, exp, sig] = value.split(".");
  if ((role !== "admin" && role !== "kobe") || !exp || !sig) return null;
  if (Number(exp) < Date.now()) return null;
  try {
    return safeEqual(sig, await hmac(`${role}.${exp}`)) ? (role as Role) : null;
  } catch {
    return null;
  }
}

export function roleForPassword(pw: string): Role | null {
  const admin = process.env.ADMIN_PASSWORD;
  const kobe = process.env.KOBE_PASSWORD;
  if (admin && safeEqual(pw, admin)) return "admin";
  if (kobe && safeEqual(pw, kobe)) return "kobe";
  return null;
}

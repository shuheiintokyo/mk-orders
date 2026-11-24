"use client";
import { Status } from "../lib/types";
import { logout } from "../lib/client";

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  return <span className={`pill s-${status}`}>{label ?? status}</span>;
}

export function BrandMark() {
  return <span className="brand-mark" aria-hidden>MK</span>;
}

export function AppBar({ active }: { active: "orders" | "new" | "kobe" }) {
  return (
    <header className="appbar">
      <div className="appbar-in">
        <a className="brand" href="/orders">
          <BrandMark />
          <span>MK Production<small>Order manager</small></span>
        </a>
        <nav className="nav">
          <a href="/">📰 <span>Site</span></a>
          <a className={active === "orders" ? "on" : ""} href="/orders">📋 <span>Orders</span></a>
          <a className={active === "kobe" ? "on" : ""} href="/kobe">🏠 <span>Kobe to do</span></a>
          <button className="btn ghost sm" onClick={logout}>Log out</button>
        </nav>
      </div>
    </header>
  );
}

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

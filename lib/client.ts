"use client";
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Please log in"); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as T;
}
export const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // Japan date
export async function logout() { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }

import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "MK Orders", description: "MK Production order manager" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

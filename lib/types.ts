export const STATUSES = ["Estimate", "Agreed", "Printing", "Finished", "Shipped"] as const;
export type Status = (typeof STATUSES)[number];
export const RESINS = ["Grey", "White", "Black", "Clear", "Tough 1500", "Flexible 80A"];
export const CARRIERS = ["Click Post", "Yu-Packet", "Takkyubin Compact", "Letter Pack", "Yu-Pack"];
export const PAYMENT_METHODS = ["Bank transfer", "Stripe", "Square", "PayPal", "coconala"];

export type Order = {
  id: string; // Notion page id
  number: number | null; // Order ID (MK-n)
  url: string;
  title: string;
  status: Status;
  customer: string;
  customerEmail: string;
  modelFiles: string;
  resin: string;
  resinMl: number | null;
  yenPerMl: number | null;
  handsOnMinutes: number | null;
  shippingYen: number | null;
  carrier: string;
  finalPrice: number | null;
  paid: boolean;
  paymentMethod: string;
  trackingNumber: string;
  notes: string;
  quotedDate: string | null;
  agreedDate: string | null;
  shippedDate: string | null;
};

export type Role = "admin" | "kobe";

/** Fields the Kobe view may change */
export const KOBE_FIELDS: (keyof Order)[] = [
  "status", "handsOnMinutes", "carrier", "trackingNumber", "notes", "shippedDate",
];
export const KOBE_STATUSES: Status[] = ["Agreed", "Printing", "Finished"];

/** What the Kobe login is allowed to see: printing details only, no customer or money fields */
export function forKobe(o: Order): Partial<Order> {
  const { id, number, title, status, resin, resinMl, handsOnMinutes, carrier, trackingNumber, notes, agreedDate, shippedDate } = o;
  return { id, number, title, status, resin, resinMl, handsOnMinutes, carrier, trackingNumber, notes, agreedDate, shippedDate };
}

export const ORDER_STATUS = {
  DITERIMA: { label: "Diterima", badge: "bg-slate-100 text-slate-700 ring-slate-200" },
  DIPROSES: { label: "Diproses", badge: "bg-amber-100 text-amber-700 ring-amber-200" },
  SELESAI: { label: "Selesai", badge: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  DIAMBIL: { label: "Diambil", badge: "bg-sky-100 text-sky-700 ring-sky-200" },
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS;
export const ORDER_STATUS_SEQUENCE: OrderStatusKey[] = ["DITERIMA", "DIPROSES", "SELESAI", "DIAMBIL"];

export const PAYMENT_STATUS = {
  BELUM_LUNAS: { label: "Belum Lunas", badge: "bg-rose-100 text-rose-700 ring-rose-200" },
  LUNAS: { label: "Lunas", badge: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  DP: { label: "DP", badge: "bg-amber-100 text-amber-700 ring-amber-200" },
} as const;

export type PaymentStatusKey = keyof typeof PAYMENT_STATUS;

export const SATUAN = {
  KG: { label: "kg" },
  PCS: { label: "pcs" },
} as const;

export const EXPENSE_CATEGORIES = ["Bahan", "Listrik & Air", "Gaji", "Operasional", "Transportasi", "Lainnya"] as const;

export const PAYMENT_METHODS = ["Tunai", "Transfer", "QRIS"] as const;

export const ORDER_STATUS_FILTER = {
  ALL: { label: "Semua Status" },
  ...ORDER_STATUS,
} as const;

export const DAY_LABELS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;
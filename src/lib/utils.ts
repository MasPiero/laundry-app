import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(d)
  );
}

export function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function waPhone(noHp: string): string {
  const digits = noHp.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}

export function waLink(noHp: string, message: string): string {
  return `https://wa.me/${waPhone(noHp)}?text=${encodeURIComponent(message)}`;
}

export function waMessage(data: {
  nama: string;
  noOrder: string;
  total: number;
  paymentStatus?: string;
  dp?: number;
}): string {
  let payLine: string;
  if (data.paymentStatus === "LUNAS") {
    payLine = `Total tagihan: *${formatIDR(data.total)}* (sudah LUNAS)`;
  } else if (data.paymentStatus === "DP" && data.dp && data.dp > 0) {
    const sisa = Math.max(data.total - data.dp, 0);
    payLine =
      `Total tagihan: *${formatIDR(data.total)}*\n` +
      `DP yang sudah dibayar: *${formatIDR(data.dp)}*\n` +
      `Sisa tagihan (kekurangan): *${formatIDR(sisa)}*`;
  } else {
    payLine = `Total tagihan: *${formatIDR(data.total)}* (belum dibayar)`;
  }
  const lines = [
    "PEMBERITAHUAN CUCIAN",
    "",
    `Halo ${data.nama},`,
    "",
    `Cucian Anda dengan No. Order *${data.noOrder}* telah *SELESAI* diproses.`,
    payLine,
    "",
  ];
  if (data.paymentStatus !== "LUNAS") {
    lines.push(
      "Untuk yang masih ada sisa tagihan, mohon dibawa saat pengambilan. Terima kasih."
    );
  } else {
    lines.push("Mohon segera diambil di toko. Terima kasih.");
  }
  return lines.join("\n");
}
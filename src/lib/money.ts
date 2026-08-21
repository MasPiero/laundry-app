import { z } from "zod";

export function normalizeRupiah(v: unknown): unknown {
  if (typeof v !== "string") return v;
  return (v.match(/\d+/g) ?? []).join("");
}

export const rupiahNonNegative = z.preprocess(
  normalizeRupiah,
  z.coerce.number().int("Jumlah harus bilangan bulat").min(0, "Jumlah tidak boleh negatif")
);

export const rupiahPositive = z.preprocess(
  normalizeRupiah,
  z.coerce.number().int("Jumlah harus bilangan bulat").positive("Jumlah harus lebih dari 0")
);
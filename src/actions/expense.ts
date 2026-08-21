"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { rupiahPositive } from "@/lib/money";

const expenseSchema = z.object({
  kategori: z.string().min(1, "Kategori wajib diisi").max(50),
  jumlah: rupiahPositive,
  keterangan: z.string().max(300).optional().or(z.literal("")),
  tanggal: z.coerce.date({ message: "Tanggal tidak valid" }),
});

export type ExpenseState = { error?: string; ok?: boolean };

export async function createExpense(prev: ExpenseState, formData: FormData): Promise<ExpenseState> {
  const user = await requireUser();
  if (!user) return { error: "Tidak terautentikasi" };

  const parsed = expenseSchema.safeParse({
    kategori: formData.get("kategori"),
    jumlah: formData.get("jumlah"),
    keterangan: formData.get("keterangan"),
    tanggal: formData.get("tanggal") || new Date().toISOString().slice(0, 10),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data tidak valid" };
  }

  const date = new Date(parsed.data.tanggal);
  date.setHours(12, 0, 0, 0);

  await prisma.expense.create({
    data: {
      kategori: parsed.data.kategori,
      jumlah: parsed.data.jumlah,
      keterangan: parsed.data.keterangan || null,
      tanggal: date,
      createdById: user.id,
    },
  });
  revalidatePath("/finance");
  revalidatePath("/");
  return { ok: true };
}

export async function updateExpense(prev: ExpenseState, formData: FormData): Promise<ExpenseState> {
  await requireUser();
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID tidak ditemukan" };

  const parsed = expenseSchema.safeParse({
    kategori: formData.get("kategori"),
    jumlah: formData.get("jumlah"),
    keterangan: formData.get("keterangan"),
    tanggal: formData.get("tanggal") || new Date().toISOString().slice(0, 10),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data tidak valid" };
  }

  const date = new Date(parsed.data.tanggal);
  date.setHours(12, 0, 0, 0);

  await prisma.expense.update({
    where: { id },
    data: {
      kategori: parsed.data.kategori,
      jumlah: parsed.data.jumlah,
      keterangan: parsed.data.keterangan || null,
      tanggal: date,
    },
  });
  revalidatePath("/finance");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  await requireUser();
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/finance");
  revalidatePath("/");
}
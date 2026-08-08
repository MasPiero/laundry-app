"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const customerSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  noHp: z.string().min(5, "No. HP wajib diisi").max(20),
  alamat: z.string().max(200).optional().or(z.literal("")),
});

export type CustomerState = { error?: string; ok?: boolean };

function isUniqueConstraint(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

function parse(formData: FormData): { data?: { nama: string; noHp: string; alamat: string | null }; error?: string } {
  const raw = {
    nama: formData.get("nama")?.toString() ?? "",
    noHp: formData.get("noHp")?.toString() ?? "",
    alamat: formData.get("alamat")?.toString() ?? "",
  };
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data tidak valid" };
  }
  return {
    data: {
      nama: parsed.data.nama.trim(),
      noHp: parsed.data.noHp.trim(),
      alamat: parsed.data.alamat || null,
    },
  };
}

export async function createCustomer(
  _prev: CustomerState,
  formData: FormData
): Promise<CustomerState> {
  const user = await requireUser();
  if (!user) return { error: "Tidak terautentikasi" };

  const result = parse(formData);
  if (result.error) return { error: result.error };
  if (!result.data) return { error: "Data tidak valid" };

  try {
    await prisma.customer.create({
      data: result.data,
    });
  } catch (e: unknown) {
    if (isUniqueConstraint(e)) {
      return { error: `No. HP ${result.data.noHp} sudah terdaftar oleh pelanggan lain.` };
    }
    return { error: "Gagal menyimpan pelanggan." };
  }
  revalidatePath("/customers");
  return { ok: true };
}

export async function updateCustomer(
  _prev: CustomerState,
  formData: FormData
): Promise<CustomerState> {
  const user = await requireUser();
  if (!user) return { error: "Tidak terautentikasi" };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID pelanggan tidak ditemukan" };

  const result = parse(formData);
  if (result.error || !result.data) return { error: result.error ?? "Data tidak valid" };

  try {
    await prisma.customer.update({
      where: { id },
      data: result.data,
    });
  } catch (e: unknown) {
    if (isUniqueConstraint(e)) {
      return { error: `No. HP ${result.data.noHp} sudah terdaftar oleh pelanggan lain.` };
    }
    return { error: "Gagal menyimpan pelanggan." };
  }
  revalidatePath("/customers");
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tidak terautentikasi" };

  try {
    const orders = await prisma.order.count({ where: { customerId: id } });
    if (orders > 0) {
      return { ok: false, error: "Pelanggan memiliki order, tidak bisa dihapus." };
    }
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus pelanggan." };
  }
}
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const serviceSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  satuan: z.enum(["KG", "PCS"]),
  harga: z.coerce.number().int().min(0, "Harga tidak boleh negatif").refine((v) => v > 0, "Harga wajib lebih dari 0"),
});

export type ServiceState = { error?: string; ok?: boolean };

function parse(formData: FormData) {
  const parsed = serviceSchema.safeParse({
    nama: formData.get("nama"),
    satuan: formData.get("satuan"),
    harga: formData.get("harga"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data tidak valid" };
  }
  return { data: { nama: parsed.data.nama.trim(), satuan: parsed.data.satuan, harga: parsed.data.harga } };
}

export async function createService(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  await requireUser();
  const result = parse(formData);
  if ("error" in result) return result;
  await prisma.service.create({ data: result.data });
  revalidatePath("/services");
  return { ok: true };
}

export async function updateService(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  await requireUser();
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID layanan tidak ditemukan" };
  const result = parse(formData);
  if ("error" in result) return result;
  await prisma.service.update({ where: { id }, data: result.data });
  revalidatePath("/services");
  return { ok: true };
}

export async function toggleService(id: string, aktif: boolean) {
  await requireUser();
  await prisma.service.update({ where: { id }, data: { aktif } });
  revalidatePath("/services");
}

export async function deleteService(id: string) {
  await requireUser();
  try {
    const used = await prisma.orderItem.count({ where: { serviceId: id } });
    if (used > 0) {
      return { ok: false, error: "Layanan sudah dipakai di order, tidak bisa dihapus." };
    }
    await prisma.service.delete({ where: { id } });
    revalidatePath("/services");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus layanan." };
  }
}
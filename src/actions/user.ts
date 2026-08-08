"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["OWNER", "KASIR"]),
});

export type UserState = { error?: string; ok?: boolean };

export async function createUser(_prev: UserState, formData: FormData): Promise<UserState> {
  await requireOwner();

  const parsed = userSchema.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "KASIR",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data tidak valid" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email sudah terdaftar." };

  await prisma.user.create({
    data: {
      nama: parsed.data.nama.trim(),
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: parsed.data.role,
    },
  });
  revalidatePath("/users");
  return { ok: true };
}

export async function resetPassword(id: string, formData: FormData) {
  await requireOwner();
  const password = formData.get("password")?.toString() ?? "";
  if (password.length < 6) return { error: "Password minimal 6 karakter" };
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/users");
  return { ok: true };
}

export async function toggleUserActive(id: string, active: boolean) {
  await requireOwner();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "Pengguna tidak ditemukan" };
  if (target.role === "OWNER") return { error: "Tidak bisa menonaktifkan akun Owner." };
  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/users");
  return { ok: true };
}

export async function deleteUser(id: string) {
  const owner = await requireOwner();
  if (id === owner.id) return { error: "Tidak bisa menghapus akun sendiri." };
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "Pengguna tidak ditemukan" };
  if (target.role === "OWNER") return { error: "Tidak bisa menghapus akun Owner." };
  const used = await prisma.order.count({ where: { createdById: id } });
  if (used > 0) return { error: "Pengguna memiliki riwayat order, nonaktifkan saja." };
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  return { ok: true };
}
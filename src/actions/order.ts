"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { rupiahNonNegative } from "@/lib/money";

export type OrderState = { error?: string; ok?: boolean };

const itemSchema = z.object({
  serviceId: z.string().min(1, "Pilih layanan"),
  qty: z.coerce.number().positive("Qty harus lebih dari 0"),
});

const orderSchema = z.object({
  customerId: z.string(),
  status: z.enum(["DITERIMA", "DIPROSES", "SELESAI", "DIAMBIL"]),
  statusBayar: z.enum(["BELUM_LUNAS", "LUNAS", "DP"]),
  dp: rupiahNonNegative.default(0),
  keterangan: z.string().max(500).nullish(),
  items: z.array(itemSchema).min(1, "Minimal 1 item layanan"),
});

const pad = (n: number) => n.toString().padStart(2, "0");

const customerSchema = z.object({
  nama: z.string().min(1, "Nama pelanggan wajib diisi").max(100),
  noHp: z.string().min(5, "No. HP wajib diisi").max(20),
  alamat: z.string().max(200).optional().or(z.literal("")),
});

export async function createOrder(_n: OrderState, formData: FormData): Promise<OrderState> {
  const user = await requireUser();
  if (!user) return { error: "Tidak terautentikasi" };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.active) {
    return { error: "Akun Anda sudah tidak aktif. Silakan logout lalu login kembali." };
  }

  let items: unknown;
  try {
    items = JSON.parse((formData.get("items") as string) ?? "[]");
  } catch {
    return { error: "Data item tidak valid" };
  }

  const parsed = orderSchema.safeParse({
    customerId: formData.get("customerId")?.toString() ?? "",
    status: formData.get("status") ?? "DITERIMA",
    statusBayar: formData.get("statusBayar") ?? "BELUM_LUNAS",
    dp: formData.get("dp") ?? "0",
    keterangan: formData.get("keterangan")?.toString() ?? "",
    items,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data order tidak valid" };
  }

  const data = parsed.data;
  let customerId = data.customerId;

  if (!customerId) {
    const nc = customerSchema.safeParse({
      nama: formData.get("newCustomerName"),
      noHp: formData.get("newCustomerPhone"),
      alamat: formData.get("newCustomerAddress")?.toString() || "",
    });
    if (!nc.success) {
      const issue = nc.error.issues[0];
      return { error: issue?.message ?? "Data pelanggan baru tidak valid" };
    }
    const noHp = nc.data.noHp.trim();
    const existing = await prisma.customer.findUnique({ where: { noHp } });
    if (existing) {
      return { error: `No. HP ${noHp} sudah terdaftar atas nama ${existing.nama}. Pilih pelanggan existing atau gunakan nomor lain.` };
    }
    const cust = await prisma.customer.create({
      data: {
        nama: nc.data.nama.trim(),
        noHp,
        alamat: nc.data.alamat || null,
      },
    });
    customerId = cust.id;
  } else {
    const cust = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!cust) return { error: "Pelanggan tidak ditemukan." };
  }

  const services = await prisma.service.findMany({
    where: { id: { in: data.items.map((i) => i.serviceId) }, aktif: true },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  if (services.length !== data.items.length) {
    return { error: "Salah satu layanan tidak tersedia / tidak aktif." };
  }

  const orderItems = data.items.map((it) => {
    const s = serviceMap.get(it.serviceId)!;
    const subtotal = Math.round(it.qty * s.harga);
    return { serviceId: s.id, qty: it.qty, harga: s.harga, subtotal };
  });
  const total = orderItems.reduce((a, b) => a + b.subtotal, 0);

  const now = new Date();
  const todayCount = await prisma.order.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      },
    },
  });
  const noOrder = `LAU-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(todayCount + 1)}`;

  try {
    await prisma.order.create({
      data: {
        noOrder,
        customerId,
        status: data.status,
        statusBayar: data.statusBayar,
        dp: data.statusBayar === "DP" ? data.dp : 0,
        total,
        keterangan: data.keterangan || null,
        paidAt: data.statusBayar === "LUNAS" ? new Date() : null,
        createdById: user.id,
        items: { create: orderItems },
      },
    });
  } catch (e: unknown) {
    console.error("createOrder failed:", e);
    const message =
      typeof e === "object" && e !== null && "message" in e
        ? String((e as { message: unknown }).message)
        : "";
    if (message.includes("Foreign key constraint") || message.includes("Foreign constraint failed")) {
      return { error: "Gagal menyimpan order: data pelanggan/layanan tidak valid." };
    }
    return { error: "Gagal menyimpan order. Coba lagi." };
  }

  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true };
}

export async function updateOrderStatus(id: string, status: string) {
  await requireUser();
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/");
}

export async function updateOrderPayment(
  id: string,
  statusBayar: string,
  dp?: number
): Promise<{ ok?: boolean; error?: string } | void> {
  await requireUser();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "Order tidak ditemukan." };

  if (order.statusBayar === "LUNAS" && statusBayar !== "LUNAS") {
    return {
      error: "Order ini sudah LUNAS dan terkunci. Ubah kembali ke DP/belum lunas tidak diizinkan agar pendapatan tidak terhitung ganda.",
    };
  }

  if (statusBayar === "LUNAS") {
    await prisma.order.update({
      where: { id },
      data: { statusBayar: "LUNAS", dp: 0, paidAt: order.paidAt ?? new Date() },
    });
  } else if (statusBayar === "DP") {
    await prisma.order.update({
      where: { id },
      data: { statusBayar: "DP", dp: dp ?? 0, paidAt: null },
    });
  } else {
    await prisma.order.update({
      where: { id },
      data: { statusBayar: "BELUM_LUNAS", dp: 0, paidAt: null },
    });
  }
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/");
}

export async function markOrderContacted(id: string) {
  await requireUser();
  await prisma.order.update({ where: { id }, data: { waContacted: true } });
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/");
}

export async function editOrderItems(
  id: string,
  formData: FormData
): Promise<OrderState> {
  await requireUser();
  let items: unknown;
  try {
    items = JSON.parse((formData.get("items") as string) ?? "[]");
  } catch {
    return { error: "Data item tidak valid" };
  }
  const parsed = orderSchema.pick({ items: true }).safeParse({ items });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data item tidak valid" };
  }

  const services = await prisma.service.findMany({
    where: { id: { in: parsed.data.items.map((i) => i.serviceId) } },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  if (services.length !== parsed.data.items.length) {
    return { error: "Salah satu layanan tidak tersedia." };
  }

  const orderItems = parsed.data.items.map((it) => {
    const s = serviceMap.get(it.serviceId)!;
    const qty = Number(it.qty);
    const subtotal = Math.round(qty * s.harga);
    return { serviceId: s.id, qty, harga: s.harga, subtotal };
  });
  const total = orderItems.reduce((a, b) => a + b.subtotal, 0);

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: id } });
    await tx.order.update({
      where: { id },
      data: { total, items: { create: orderItems } },
    });
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteOrder(id: string) {
  await requireUser();
  await prisma.order.delete({ where: { id } });
  revalidatePath("/orders");
  revalidatePath("/");
}
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const pad = (n: number) => n.toString().padStart(2, "0");

function isoDate(daysAgo: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 30 + Math.floor(Math.random() * 25), 0, 0);
  return d;
}

async function main() {
  console.log("Start seeding...");

  const owner = await prisma.user.upsert({
    where: { email: "owner@laundry.com" },
    update: {},
    create: {
      email: "owner@laundry.com",
      nama: "Owner Laundry",
      passwordHash: await bcrypt.hash("owner123", 10),
      role: "OWNER",
    },
  });
  await prisma.user.upsert({
    where: { email: "kasir@laundry.com" },
    update: {},
    create: {
      email: "kasir@laundry.com",
      nama: "Kasir Satu",
      passwordHash: await bcrypt.hash("kasir123", 10),
      role: "KASIR",
    },
  });

  if ((await prisma.service.count()) === 0) {
    await prisma.service.createMany({
      data: [
        { nama: "Cuci Kiloan", satuan: "KG", harga: 6000 },
        { nama: "Cuci + Setrika", satuan: "KG", harga: 8000 },
        { nama: "Setrika Saja", satuan: "KG", harga: 5000 },
        { nama: "Cuci Sepatu", satuan: "PCS", harga: 25000 },
        { nama: "Selimut", satuan: "PCS", harga: 15000 },
        { nama: "Bedcover", satuan: "PCS", harga: 25000 },
        { nama: "Gorden", satuan: "PCS", harga: 30000 },
      ],
    });
  }

  if ((await prisma.customer.count()) === 0) {
    await prisma.customer.createMany({
      data: [
        { nama: "Budi Santoso", noHp: "081234567890", alamat: "Jl. Merdeka No. 12, Malang" },
        { nama: "Siti Aminah", noHp: "085712345678", alamat: "Jl. Ijen No. 3, Malang" },
        { nama: "Andi Wijaya", noHp: "087812345678", alamat: "Perum Griya Asri Blok C5, Malang" },
      ],
    });
  }

  if ((await prisma.order.count()) === 0) {
    const customers = await prisma.customer.findMany();
    const svc = await prisma.service.findMany();
    const statuses = ["DIPROSES", "SELESAI", "DIAMBIL", "DITERIMA"] as string[];
    const totals = [0, 0];

    for (let i = 0; i < 14; i++) {
      const cust = customers[i % customers.length];
      const servCount = (i % 3) + 1;
      const orderItems = [];
      for (let j = 0; j < servCount; j++) {
        const serv = svc[(i + j) % svc.length];
        const qty = serv.satuan === "KG" ? 2 + (i % 4) + j * 0.5 : 1;
        const subtotal = Math.round(qty * serv.harga);
        orderItems.push({ serviceId: serv.id, qty, harga: serv.harga, subtotal });
      }
      const total = orderItems.reduce((a: number, b) => a + b.subtotal, 0);
      const daysAgo = i * 2 + (i % 3);
      const tanggal = isoDate(daysAgo);
      const seq = i + 1;
      const noOrder = `LAU-${tanggal.getFullYear()}${pad(tanggal.getMonth() + 1)}${pad(tanggal.getDate())}-${pad(seq)}`;
      const status = i === 0 ? "SELESAI" : statuses[i % statuses.length];
      const lunas = status === "DIAMBIL" || status === "SELESAI" || i % 2 === 0;

      await prisma.order.create({
        data: {
          noOrder,
          customerId: cust.id,
          status,
          statusBayar: lunas ? "LUNAS" : "BELUM_LUNAS",
          total,
          waContacted: status === "DIAMBIL",
          paidAt: lunas ? tanggal : null,
          keterangan: i % 2 === 0 ? null : "Jemput cucian di rumah",
          createdAt: tanggal,
          updatedAt: tanggal,
          createdById: owner.id,
          items: { create: orderItems },
        },
      });
      if (lunas) totals[0] += total;
    }
    console.log("Seeded demo orders, income:", totals[0]);
  }

  if ((await prisma.expense.count()) === 0) {
    await prisma.expense.createMany({
      data: [
        { kategori: "Deterjen & Perawatan", jumlah: 150000, keterangan: "Pembelian deterjen, pewangi", tanggal: isoDate(5), createdById: owner.id },
        { kategori: "Listrik & Air", jumlah: 250000, keterangan: "Tagihan listrik & air bulanan", tanggal: isoDate(10), createdById: owner.id },
        { kategori: "Operasional", jumlah: 50000, keterangan: "Plastik & kertas struk", tanggal: isoDate(3, 14), createdById: owner.id },
      ],
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
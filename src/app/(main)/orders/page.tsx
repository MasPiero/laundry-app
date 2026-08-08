import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { OrdersClient } from "@/components/orders-client";

export default async function OrdersPage() {
  await requireUser();

  const [orders, services, customers] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { nama: true, noHp: true } } },
    }),
    prisma.service.findMany(),
    prisma.customer.findMany({ orderBy: { nama: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Order</h1>
        <p className="mt-1 text-sm text-slate-500">
          Buat order baru, lacak status, dan hubungi pelanggan.
        </p>
      </div>
      <OrdersClient orders={orders} services={services} customers={customers} />
    </div>
  );
}
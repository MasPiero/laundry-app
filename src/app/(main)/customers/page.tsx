import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { CustomersClient } from "@/components/customers-client";

export default async function CustomersPage() {
  await requireUser();

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Pelanggan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola data pelanggan laundry.
        </p>
      </div>
      <CustomersClient customers={customers} />
    </div>
  );
}
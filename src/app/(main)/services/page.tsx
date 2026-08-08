import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { ServicesClient } from "@/components/services-client";

export default async function ServicesPage() {
  await requireUser();

  const services = await prisma.service.findMany({
    orderBy: [{ aktif: "desc" }, { nama: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Layanan & Harga</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola jenis layanan, satuan, dan harga laundry.
        </p>
      </div>
      <ServicesClient services={services} />
    </div>
  );
}
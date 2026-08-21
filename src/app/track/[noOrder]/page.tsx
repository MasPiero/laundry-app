import { notFound } from "next/navigation";
import { Shirt, Loader2, CheckCircle2, PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { formatDateTime, formatIDR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_MESSAGE: Record<string, string> = {
  DITERIMA: "Cucian sudah diterima dan dalam antrian.",
  DIPROSES: "Cucian sedang diproses di tempat kami.",
  SELESAI: "Cucian sudah selesai dan siap diambil.",
  DIAMBIL: "Cucian sudah diambil. Terima kasih!",
};

export default async function TrackOrderPage({
  params,
}: {
  params: { noOrder: string };
}) {
  const order = await prisma.order.findUnique({
    where: { noOrder: params.noOrder },
    include: { customer: true },
  });

  if (!order) notFound();

  const st = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
  const pb = PAYMENT_STATUS[order.statusBayar as keyof typeof PAYMENT_STATUS];
  const done = order.status === "SELESAI";
  const taken = order.status === "DIAMBIL";

  const Icon = taken ? PackageCheck : done ? CheckCircle2 : Loader2;
  const iconClass = taken
    ? "bg-sky-100 text-sky-600"
    : done
      ? "bg-emerald-100 text-emerald-600"
      : "bg-amber-100 text-amber-600";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
            <Shirt className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">LaundryKu</h1>
          <p className="mt-0.5 text-sm text-slate-500">Cek status cucian Anda</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                No. Order
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-800">
                {order.noOrder}
              </p>
            </div>
            <Badge className={st?.badge}>{st?.label ?? order.status}</Badge>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-5 text-center">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${iconClass} ${
                !done && !taken ? "animate-pulse" : ""
              }`}
            >
              <Icon className="h-7 w-7" />
            </div>
            <p className="mt-3 text-base font-semibold text-slate-800">
              {taken
                ? "Cucian sudah diambil"
                : done
                  ? "Cucian selesai, siap diambil!"
                  : "Cucian masih diproses"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{STATUS_MESSAGE[order.status]}</p>
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Atas nama</dt>
              <dd className="font-medium text-slate-800">{order.customer.nama}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Masuk</dt>
              <dd className="text-slate-600">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Total</dt>
              <dd className="font-semibold text-slate-800">{formatIDR(order.total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Pembayaran</dt>
              <dd className={done ? "font-semibold text-emerald-600" : "font-semibold text-slate-700"}>
                {pb?.label ?? order.statusBayar}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Struk ini berupa status terbaru dari order {order.noOrder}.
        </p>
      </div>
    </div>
  );
}
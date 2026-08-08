import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MapPin, CalendarDays, User } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatIDR, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { OrderActions } from "@/components/order-actions";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  await requireUser();

  const [order, services] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: { include: { service: true } },
        createdBy: { select: { nama: true } },
      },
    }),
    prisma.service.findMany(),
  ]);

  if (!order) notFound();

  const st = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
  const pb = PAYMENT_STATUS[order.statusBayar as keyof typeof PAYMENT_STATUS];
  const sisa = Math.max(order.total - (order.statusBayar === "DP" ? order.dp : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/orders"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">{order.noOrder}</h1>
              <Badge className={st?.badge}>{st?.label ?? order.status}</Badge>
              <Badge className={pb?.badge}>{pb?.label ?? order.statusBayar}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Dibuat {formatDateTime(order.createdAt)} oleh {order.createdBy.nama}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!order.waContacted && order.status === "SELESAI" && (
              <Badge className="bg-amber-100 text-amber-700 ring-amber-200">Belum dihubungi</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Kolom kiri: nota + info */}
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden print-area">
            <CardHeader className="no-print flex-row items-center justify-between">
              <CardTitle>Struk / Nota</CardTitle>
              <PrintButton />
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="px-6 py-5">
                {/* Identitas toko */}
                <div className="text-center">
                  <p className="text-xl font-bold tracking-tight text-slate-900">LaundryKu</p>
                  <p className="text-xs text-slate-400">Jl. Contoh No. 1, Kota</p>
                </div>

                <div className="my-4 border-t border-dashed border-slate-200" />

                {/* Meta order */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">No. Order</span>
                    <span className="font-semibold text-slate-800">{order.noOrder}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tanggal</span>
                    <span className="text-slate-600">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-slate-700">{st?.label ?? order.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pembayaran</span>
                    <span className="font-medium text-slate-700">{pb?.label ?? order.statusBayar}</span>
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-slate-200" />

                {/* Customer */}
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{order.customer.nama}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{order.customer.noHp}</p>
                  {order.customer.alamat && (
                    <p className="mt-0.5 text-sm text-slate-500">{order.customer.alamat}</p>
                  )}
                </div>

                <div className="mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                        <th className="py-2 text-left font-medium">Layanan</th>
                        <th className="py-2 text-center font-medium">Qty</th>
                        <th className="py-2 text-right font-medium">Harga</th>
                        <th className="py-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((it) => (
                        <tr key={it.id} className="border-b border-slate-100">
                          <td className="py-2.5 font-medium text-slate-700">{it.service.nama}</td>
                          <td className="py-2.5 text-center text-slate-600">
                            {it.qty} {it.service.satuan === "KG" ? "kg" : "pcs"}
                          </td>
                          <td className="py-2.5 text-right text-slate-600">{formatIDR(it.harga)}</td>
                          <td className="py-2.5 text-right font-medium text-slate-800">{formatIDR(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">Total</span>
                      <span className="text-lg font-bold text-slate-900">{formatIDR(order.total)}</span>
                    </div>
                    {order.statusBayar === "DP" && (
                      <>
                        <div className="mt-1.5 flex items-center justify-between text-sm">
                          <span className="text-slate-500">DP</span>
                          <span className="font-semibold text-amber-600">{formatIDR(order.dp)}</span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-sm">
                          <span className="text-slate-500">Sisa</span>
                          <span className="font-semibold text-rose-600">{formatIDR(sisa)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {order.keterangan && (
                  <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Catatan</p>
                    <p className="mt-1 text-sm text-slate-700">{order.keterangan}</p>
                  </div>
                )}

                <p className="mt-5 text-center text-xs text-slate-400">
                  Terima kasih telah menggunakan LaundryKu
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kontak pelanggan */}
          <Card>
            <CardHeader>
              <CardTitle>Kontak Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{order.customer.nama}</p>
                    <p className="text-xs text-slate-400">
                      Tercatat {formatDateTime(order.customer.createdAt)}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${order.customer.noHp}`}
                  className="flex items-start gap-3 text-teal-600 transition-colors hover:text-teal-800"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="pt-2.5 text-sm font-medium">{order.customer.noHp}</span>
                </a>
                {order.customer.alamat ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 pt-2.5">
                      <p className="break-words text-sm text-slate-600">{order.customer.alamat}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-300">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <p className="pt-2.5 text-sm text-slate-400">Tanpa alamat</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom kanan: aksi & pembayaran */}
        <div className="space-y-6 xl:col-span-1">
          <OrderActions
            orderId={order.id}
            noOrder={order.noOrder}
            customer={{ nama: order.customer.nama, noHp: order.customer.noHp }}
            status={order.status}
            statusBayar={order.statusBayar}
            dpValue={order.dp}
            total={order.total}
            waContacted={order.waContacted}
            items={order.items}
            services={services}
          />
        </div>
      </div>
    </div>
  );
}
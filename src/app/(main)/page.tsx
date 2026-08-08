import Link from "next/link";
import { subDays, startOfDay, format } from "date-fns";
import {
  Banknote,
  PackageCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  PhoneOutgoing,
  Plus,
} from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { cn, formatIDR, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendChart, type TrendPoint } from "@/components/trend-chart";

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <span className={cn("absolute inset-y-0 left-0 w-1", color)} />
      <CardContent className="flex items-center gap-4 py-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white", color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const startToday = startOfDay(now);
  const last30 = subDays(now, 29);

  const [orderTodayCount, ordersActive, ordersReady, ordersNotContacted, incomeToday, paidOrders30, expenses30, recentOrders, pendingOrders] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startToday } } }),
      prisma.order.count({ where: { status: { in: ["DITERIMA", "DIPROSES"] } } }),
      prisma.order.count({ where: { status: "SELESAI" } }),
      prisma.order.count({ where: { status: "SELESAI", waContacted: false } }),
      prisma.order.aggregate({
        where: { statusBayar: "LUNAS", paidAt: { gte: startToday } },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { statusBayar: "LUNAS", paidAt: { gte: last30 } },
        select: { total: true, paidAt: true },
      }),
      prisma.expense.findMany({
        where: { tanggal: { gte: last30 } },
        select: { jumlah: true, tanggal: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { customer: true },
      }),
      prisma.order.findMany({
        where: { status: "SELESAI" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
    ]);

  const omzetToday = incomeToday._sum.total ?? 0;

  const incomeByDay = new Map<string, number>();
  const expenseByDay = new Map<string, number>();
  for (const o of paidOrders30) {
    if (!o.paidAt) continue;
    const k = format(o.paidAt, "yyyy-MM-dd");
    incomeByDay.set(k, (incomeByDay.get(k) ?? 0) + o.total);
  }
  for (const e of expenses30) {
    const k = format(e.tanggal, "yyyy-MM-dd");
    expenseByDay.set(k, (expenseByDay.get(k) ?? 0) + e.jumlah);
  }

  const trend: TrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(now, i);
    const k = format(d, "yyyy-MM-dd");
    trend.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      Masuk: incomeByDay.get(k) ?? 0,
      Keluar: expenseByDay.get(k) ?? 0,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Selamat datang, {user.nama} · {format(now, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" /> Order Baru
          </Link>
          <Link
            href="/finance"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Laporan
          </Link>
        </div>
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Omzet hari ini"
          value={formatIDR(omzetToday)}
          sub={`${format(now, "d MMM")}`}
          icon={<Banknote className="h-5 w-5" />}
          color="bg-teal-600"
        />
        <StatCard
          title="Order hari ini"
          value={String(orderTodayCount)}
          sub="Total order masuk"
          icon={<PackageCheck className="h-5 w-5" />}
          color="bg-sky-500"
        />
        <StatCard
          title="Order aktif"
          value={String(ordersActive)}
          sub="Dalam pengerjaan"
          icon={<Loader2 className="h-5 w-5" />}
          color="bg-amber-500"
        />
        <StatCard
          title="Siap diambil"
          value={String(ordersReady)}
          sub={
            ordersNotContacted > 0 ? `${ordersNotContacted} belum dihubungi` : "Semua sudah dihubungi"
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="bg-emerald-600"
        />
      </div>

      {/* Grafik + daftar antrian */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tren Pemasukan vs Pengeluaran</CardTitle>
            <span className="text-xs font-medium text-slate-400">30 hari terakhir</span>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>

        <Card className="flex flex-col lg:max-h-full">
          <CardHeader>
            <CardTitle>Menunggu dihubungi / diambil</CardTitle>
            {pendingOrders.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 ring-amber-200">
                {pendingOrders.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1 space-y-2.5">
            {pendingOrders.length === 0 ? (
              <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-1 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                <p className="text-sm text-slate-400">Tidak ada order menunggu. Mantap!</p>
              </div>
            ) : (
              pendingOrders.map((o) => {
                const pb = PAYMENT_STATUS[o.statusBayar as keyof typeof PAYMENT_STATUS];
                return (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-teal-300 hover:bg-teal-50/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">{o.noOrder}</p>
                      <p className="truncate text-xs text-slate-400">
                        {o.customer.nama} · {formatIDR(o.total)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!o.waContacted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <PhoneOutgoing className="h-3 w-3" />
                        </span>
                      )}
                      <Badge className={pb?.badge}>{pb?.label ?? o.statusBayar}</Badge>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order terbaru */}
      <Card>
        <CardHeader>
          <CardTitle>Order terbaru</CardTitle>
          <Link href="/orders" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            Lihat semua →
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-semibold">No. Order</th>
                  <th className="px-5 py-3 font-semibold">Pelanggan</th>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 text-right font-semibold">Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Belum ada order. Klik &quot;Order Baru&quot; untuk memulai.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => {
                    const st = ORDER_STATUS[o.status as keyof typeof ORDER_STATUS];
                    const pb = PAYMENT_STATUS[o.statusBayar as keyof typeof PAYMENT_STATUS];
                    return (
                      <tr key={o.id} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <Link
                            href={`/orders/${o.id}`}
                            className="font-semibold text-teal-600 hover:underline"
                          >
                            {o.noOrder}
                          </Link>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-600">{o.customer.nama}</td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(o.createdAt)}</td>
                        <td className="px-5 py-3">
                          <Badge className={st?.badge}>{st?.label ?? o.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">
                          {formatIDR(o.total)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Badge className={pb?.badge}>{pb?.label ?? o.statusBayar}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
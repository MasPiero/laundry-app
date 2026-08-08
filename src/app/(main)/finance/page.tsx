import Link from "next/link";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  format,
  parseISO,
  isValid,
} from "date-fns";
import { PiggyBank, TrendingUp, TrendingDown, FileSpreadsheet, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceTracker } from "@/components/finance-tracker";
import { TrendChart, type TrendPoint } from "@/components/trend-chart";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { periode?: string; from?: string; to?: string };
}) {
  await requireUser();
  const today = new Date();
  const periode = searchParams.periode ?? "month";

  let start: Date;
  let end: Date;
  if (periode === "custom" && searchParams.from && searchParams.to) {
    const f = parseISO(searchParams.from);
    if (isValid(f)) start = f;
    else start = startOfDay(today);
  } else {
    start = startOfDay(today);
  }
  // For non-custom set start again below
  switch (periode) {
    case "today":
      start = startOfDay(today);
      end = endOfDay(today);
      break;
    case "week":
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
      break;
    case "custom":
      end = searchParams.to ? parseISO(searchParams.to) : endOfMonth(today);
      break;
    default:
      start = startOfMonth(today);
      end = endOfMonth(today);
      break;
  }

  const days = Math.min(Math.floor((end.getTime() - start.getTime()) / 86400000) + 1, 92);
  if (days < 1) end = addDays(start, days);

  const [paid, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { statusBayar: "LUNAS", paidAt: { gte: start, lte: end } },
      select: {
        id: true,
        noOrder: true,
        total: true,
        paidAt: true,
        createdAt: true,
        customer: { select: { nama: true, noHp: true } },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { tanggal: { gte: start, lte: end } },
      include: { createdBy: { select: { nama: true } } },
      orderBy: { tanggal: "desc" },
    }),
  ]);

  const income = paid.reduce((a, o) => a + (o.paidAt ? o.total : 0), 0);
  const expenseSum = expenses.reduce((a, e) => a + e.jumlah, 0);
  const laba = income - expenseSum;

  // build chart data per day
  const incomeByDay = new Map<string, number>();
  const expenseByDay = new Map<string, number>();
  for (const o of paid) if (o.paidAt) {
    const k = format(o.paidAt, "yyyy-MM-dd");
    incomeByDay.set(k, (incomeByDay.get(k) ?? 0) + o.total);
  }
  for (const e of expenses) {
    const k = format(e.tanggal, "yyyy-MM-dd");
    expenseByDay.set(k, (expenseByDay.get(k) ?? 0) + e.jumlah);
  }

  const trend: TrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const k = format(d, "yyyy-MM-dd");
    trend.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      Masuk: incomeByDay.get(k) ?? 0,
      Keluar: expenseByDay.get(k) ?? 0,
    });
  }

  const rangeLabel = `${format(start, "d MMM yyyy")} - ${format(end, "d MMMM yyyy")}`;
  const rangeParam = `from=${format(start, "yyyy-MM-dd")}&to=${format(end, "yyyy-MM-dd")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h1>
          <p className="mt-1 text-sm text-slate-500">Periode: {rangeLabel}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/report/export?type=xlsx&${rangeParam}`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </a>
          <a
            href={`/api/report/export?type=pdf&${rangeParam}`}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "today", label: "Hari Ini" },
          { key: "week", label: "Minggu Ini" },
          { key: "month", label: "Bulan Ini" },
        ].map((p) => (
          <Link
            key={p.key}
            href={`/finance?periode=${p.key}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              periode === p.key
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-600"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <form
          action="/finance"
          className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-1"
        >
          <input type="hidden" name="periode" value="custom" />
          <input
            type="date"
            name="from"
            defaultValue={format(start, "yyyy-MM-dd")}
            className="h-8 rounded-lg border-0 px-2 text-sm text-slate-700 focus:outline-none"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            name="to"
            defaultValue={format(end, "yyyy-MM-dd")}
            className="h-8 rounded-lg border-0 px-2 text-sm text-slate-700 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
          >
            Terapkan
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pemasukan</p>
              <p className="text-xl font-bold text-slate-800">{formatIDR(income)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pengeluaran</p>
              <p className="text-xl font-bold text-slate-800">{formatIDR(expenseSum)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-white">
              <PiggyBank className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Laba Bersih</p>
              <p className={`text-xl font-bold ${laba >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatIDR(laba)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grafik Pemasukan vs Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trend} />
        </CardContent>
      </Card>

      <FinanceTracker
        expenses={expenses}
        paid={paid}
        start={format(start, "yyyy-MM-dd")}
      />
    </div>
  );
}
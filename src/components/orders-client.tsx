"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { OrderForm } from "@/components/order-form";
import { formatIDR, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_STATUS_FILTER } from "@/lib/constants";

type Row = {
  id: string;
  noOrder: string;
  status: string;
  statusBayar: string;
  total: number;
  createdAt: Date;
  waContacted: boolean;
  customer: { nama: string; noHp: string };
};

export function OrdersClient({
  orders,
  services,
  customers,
}: {
  orders: Row[];
  services: { id: string; nama: string; satuan: string; harga: number; aktif: boolean }[];
  customers: { id: string; nama: string; noHp: string; alamat: string | null }[];
}) {
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [paymentFilter, setPaymentFilter] = React.useState("ALL");
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filtered = orders.filter((o) => {
    const matchQ =
      !q ||
      o.noOrder.toLowerCase().includes(q.toLowerCase()) ||
      o.customer.nama.toLowerCase().includes(q.toLowerCase()) ||
      o.customer.noHp.includes(q);
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchPay = paymentFilter === "ALL" || o.statusBayar === paymentFilter;
    return matchQ && matchStatus && matchPay;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(filtered.length, safePage * pageSize);

  const applyFilters = (next: Partial<{ q: string; status: string; payment: string }>) => {
    if ("q" in next) setQ(next.q ?? "");
    if ("status" in next) setStatusFilter(next.status ?? "ALL");
    if ("payment" in next) setPaymentFilter(next.payment ?? "ALL");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => applyFilters({ q: e.target.value })}
              placeholder="Cari no. order / pelanggan / HP"
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            {Object.entries(ORDER_STATUS_FILTER).map(([k, v]) =>
              k === "ALL" ? null : (
                <option key={k} value={k}>
                  {v.label}
                </option>
              )
            )}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => applyFilters({ payment: e.target.value })}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="ALL">Semua Pembayaran</option>
            {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Order Baru
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">No. Order</th>
                <th className="px-5 py-3 font-medium">Pelanggan</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Pembayaran</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 text-right font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada order yang cocok.
                  </td>
                </tr>
              )}
              {pageRows.map((o) => {
                const st = ORDER_STATUS[o.status as keyof typeof ORDER_STATUS];
                const pb = PAYMENT_STATUS[o.statusBayar as keyof typeof PAYMENT_STATUS];
                return (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/orders/${o.id}`} className="font-medium text-teal-600 hover:underline">
                          {o.noOrder}
                        </Link>
                        {o.status === "SELESAI" && !o.waContacted && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Belum dihubungi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-700">{o.customer.nama}</p>
                      <p className="text-xs text-slate-400">{o.customer.noHp}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Badge className={st?.badge}>{st?.label ?? o.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={pb?.badge}>{pb?.label ?? o.statusBayar}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{formatIDR(o.total)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600"
                        aria-label="Lihat detail"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-slate-500">
          Menampilkan <span className="font-semibold text-slate-700">{startIdx}</span>–<span className="font-semibold text-slate-700">{endIdx}</span> dari{" "}
          <span className="font-semibold text-slate-700">{filtered.length}</span> order
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Sebelumnya
          </Button>
          <span className="px-2 text-sm text-slate-500">
            Halaman {safePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Berikutnya <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Buat Order Baru">
        <OrderForm services={services} customers={customers} onDone={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
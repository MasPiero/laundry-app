"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormError } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { formatIDR, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

type ExpenseRow = {
  id: string;
  kategori: string;
  jumlah: number;
  keterangan: string | null;
  tanggal: Date;
  createdBy: { nama: string };
};

type PaidRow = {
  id: string;
  noOrder: string;
  total: number;
  paidAt: Date | null;
  customer: { nama: string; noHp: string };
};

export function FinanceTracker({
  expenses,
  paid,
  start,
}: {
  expenses: ExpenseRow[];
  paid: PaidRow[];
  start: string;
  }) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<ExpenseRow | null>(null);
  const [deleting, setDeleting] = React.useState<ExpenseRow | null>(null);

  const [createState, createAction, createPending] = useFormState(createExpense, {});
  const [updateState, updateAction, updatePending] = useFormState(updateExpense, {});

  React.useEffect(() => {
    if (createState?.ok) {
      setCreating(false);
      router.refresh();
    }
  }, [createState, router]);

  React.useEffect(() => {
    if (updateState?.ok) {
      setEditing(null);
      router.refresh();
    }
  }, [updateState, router]);

  const current = editing ? updateState : createState;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran</CardTitle>
          <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}>
            <Plus className="h-4 w-4" /> Input Pengeluaran
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
                  <th className="px-5 py-3 font-medium">Keterangan</th>
                  <th className="px-5 py-3 text-right font-medium">Jumlah</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Belum ada pengeluaran pada periode ini.
                    </td>
                  </tr>
                )}
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-slate-600">{formatDate(e.tanggal)}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{e.kategori}</td>
                    <td className="max-w-[140px] truncate px-5 py-3 text-slate-500">{e.keterangan ?? "-"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-rose-600">{formatIDR(e.jumlah)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditing(e); setCreating(false); }}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-600"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(e)}
                          className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pemasukan (Order Lunas)</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">No. Order</th>
                  <th className="px-5 py-3 font-medium">Pelanggan</th>
                  <th className="px-5 py-3 font-medium">Dibayar</th>
                  <th className="px-5 py-3 text-right font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {paid.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      Belum ada pemasukan pada periode ini.
                    </td>
                  </tr>
                )}
                {paid.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-teal-600">{o.noOrder}</td>
                    <td className="px-5 py-3 text-slate-600">{o.customer.nama}</td>
                    <td className="px-5 py-3 text-slate-500">{o.paidAt ? formatDate(o.paidAt) : "-"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatIDR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Edit Pengeluaran" : "Input Pengeluaran"}>
        <form action={editing ? updateAction : createAction} className="space-y-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div>
            <Label htmlFor="kategori">Kategori</Label>
            <select
              id="kategori"
              name="kategori"
              defaultValue={editing?.kategori ?? EXPENSE_CATEGORIES[0]}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="jumlah">Jumlah (Rp)</Label>
            <Input id="jumlah" name="jumlah" type="number" min={1} defaultValue={editing?.jumlah} required placeholder="misal: 150000" />
          </div>
          <div>
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input id="tanggal" name="tanggal" type="date" defaultValue={editing ? formatDate(editing.tanggal) : start} required />
          </div>
          <div>
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input id="keterangan" name="keterangan" defaultValue={editing?.keterangan ?? ""} placeholder="misal: beli deterjen" />
          </div>
          <FormError msg={current?.error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Batal</Button>
            <Button type="submit" disabled={editing ? updatePending : createPending}>
              {(editing ? updatePending : createPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await deleteExpense(deleting!.id);
          router.refresh();
        }}
        title="Hapus pengeluaran?"
        message={`Pengeluaran ${formatIDR(deleting?.jumlah ?? 0)} akan dihapus.`}
      />
    </div>
  );
}
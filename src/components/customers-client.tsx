"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { createCustomer, updateCustomer, deleteCustomer } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Label, FormError } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

type CustomerRow = {
  id: string;
  nama: string;
  noHp: string;
  alamat: string | null;
  createdAt: Date;
  _count: { orders: number };
};

export function CustomersClient({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [editing, setEditing] = React.useState<CustomerRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CustomerRow | null>(null);

  const [createState, createAction, createPending] = useFormState(createCustomer, {});
  const [updateState, updateAction, updatingPd] = useFormState(updateCustomer, {});

  const filtered = customers.filter(
    (c) =>
      c.nama.toLowerCase().includes(q.toLowerCase()) ||
      c.noHp.includes(q) ||
      (c.alamat ?? "").toLowerCase().includes(q.toLowerCase())
  );

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / no. HP / alamat"
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setCreating(true); setEditing(null); }}>
          <Plus className="h-4 w-4" /> Tambah Pelanggan
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-5 py-3 font-medium">No. HP</th>
                <th className="px-5 py-3 font-medium">Alamat</th>
                <th className="px-5 py-3 font-medium">Total Order</th>
                <th className="px-5 py-3 font-medium">Terdaftar</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada data pelanggan.
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800">{c.nama}</td>
                  <td className="px-5 py-3 text-slate-600">{c.noHp}</td>
                  <td className="px-5 py-3 text-slate-500">{c.alamat ?? "-"}</td>
                  <td className="px-5 py-3 text-slate-700">{c._count.orders}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setEditing(c); setCreating(false); }}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-600"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(c)}
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
      </div>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Edit Pelanggan" : "Tambah Pelanggan"}>
        <form action={editing ? updateAction : createAction} className="space-y-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div>
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" name="nama" defaultValue={editing?.nama} required placeholder="Nama pelanggan" />
          </div>
          <div>
            <Label htmlFor="noHp">No. HP</Label>
            <Input id="noHp" name="noHp" defaultValue={editing?.noHp} required placeholder="contoh: 081234567890" inputMode="tel" />
          </div>
          <div>
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea id="alamat" name="alamat" defaultValue={editing?.alamat ?? ""} placeholder="Alamat (opsional)" />
          </div>
          <FormError msg={(editing ? updateState : createState)?.error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Batal</Button>
            <Button type="submit" disabled={editing ? updatingPd : createPending}>
              {(editing ? updatingPd : createPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          const res = await deleteCustomer(deleting!.id);
          if (res?.error) alert(res.error);
          router.refresh();
        }}
        title="Hapus pelanggan?"
        message={`Pelanggan "${deleting?.nama}" akan dihapus permanen.`}
      />
    </div>
  );
}
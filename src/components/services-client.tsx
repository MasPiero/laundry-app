"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { Plus, Pencil, Trash2, Loader2, Power } from "lucide-react";
import { createService, updateService, deleteService, toggleService } from "@/actions/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormError } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { formatIDR } from "@/lib/utils";

type ServiceRow = {
  id: string;
  nama: string;
  satuan: string;
  harga: number;
  aktif: boolean;
};

export function ServicesClient({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<ServiceRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<ServiceRow | null>(null);

  const [createState, createAction, createPending] = useFormState(createService, {});
  const [updateState, updateAction, updatingPd] = useFormState(updateService, {});

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
      <div className="flex justify-end">
        <Button onClick={() => { setCreating(true); setEditing(null); }}>
          <Plus className="h-4 w-4" /> Tambah Layanan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            Belum ada layanan. Tambahkan layanan pertama.
          </p>
        )}
        {services.map((s) => (
          <div
            key={s.id}
            className={`rounded-xl border bg-white p-5 shadow-sm transition-opacity ${s.aktif ? "border-slate-200" : "border-slate-200 opacity-60"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{s.nama}</p>
                <p className="mt-1 text-2xl font-bold text-teal-600">{formatIDR(s.harga)}</p>
                <p className="text-xs text-slate-400">per {s.satuan === "KG" ? "kg" : "pcs"}</p>
              </div>
              <Badge className={s.aktif ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}>
                {s.aktif ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
              <button
                onClick={() => { setEditing(s); setCreating(false); }}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-600"
                aria-label="Edit layanan"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => { toggleService(s.id, !s.aktif); router.refresh(); }}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Ubah status aktif"
              >
                <Power className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleting(s)}
                className="ml-auto rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Hapus layanan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Edit Layanan" : "Tambah Layanan"}>
        <form action={editing ? updateAction : createAction} className="space-y-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div>
            <Label htmlFor="nama">Nama Layanan</Label>
            <Input id="nama" name="nama" defaultValue={editing?.nama} required placeholder="contoh: Cuci Kiloan" />
          </div>
          <div>
            <Label htmlFor="satuan">Satuan</Label>
            <select id="satuan" name="satuan" defaultValue={editing?.satuan ?? "KG"} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="KG">Kilogram (kg)</option>
              <option value="PCS">Pcs / Potong</option>
            </select>
          </div>
          <div>
            <Label htmlFor="harga">Harga (Rp)</Label>
            <Input id="harga" name="harga" type="number" min={1} defaultValue={editing?.harga} required placeholder="5000" />
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
          const res = await deleteService(deleting!.id);
          if (res?.error) alert(res.error);
          router.refresh();
        }}
        title="Hapus layanan?"
        message={`Layanan "${deleting?.nama}" akan dihapus.`}
      />
    </div>
  );
}
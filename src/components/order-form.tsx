"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import { createOrder } from "@/actions/order";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, FormError } from "@/components/ui/label";
import { formatIDR } from "@/lib/utils";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";

type Service = { id: string; nama: string; satuan: string; harga: number; aktif: boolean };
type Customer = { id: string; nama: string; noHp: string; alamat: string | null };

type Item = { serviceId: string; qty: number };

export function OrderForm({
  services,
  customers,
  onDone,
}: {
  services: Service[];
  customers: Customer[];
  onDone: () => void;
}) {
  const router = useRouter();
  const activeServices = services.filter((s) => s.aktif);

  const [customerId, setCustomerId] = React.useState(customers[0]?.id ?? "");
  const [newCustomerMode, setNewCustomerMode] = React.useState(customers.length === 0);
  const [newCustomer, setNewCustomer] = React.useState({ name: "", phone: "", address: "" });
  const [items, setItems] = React.useState<Item[]>([{ serviceId: activeServices[0]?.id ?? "", qty: 1 }]);
  const [status, setStatus] = React.useState("DITERIMA");
  const [statusBayar, setStatusBayar] = React.useState("BELUM_LUNAS");
  const [dp, setDp] = React.useState("");
  const [keterangan, setKeterangan] = React.useState("");

  const [state, action, pending] = useFormState(createOrder, {});

  const serviceMap = new Map(activeServices.map((s) => [s.id, s]));
  const total = items.reduce((sum, it) => {
    const s = serviceMap.get(it.serviceId);
    return sum + (s ? Math.round(it.qty * s.harga) : 0);
  }, 0);

  React.useEffect(() => {
    if (state?.ok) {
      onDone();
      router.refresh();
    }
  }, [state, onDone, router]);

  function addItem() {
    setItems((prev) => [...prev, { serviceId: activeServices[0]?.id ?? "", qty: 1 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="customerId" value={newCustomerMode ? "" : customerId} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="statusBayar" value={statusBayar} />
      <input type="hidden" name="dp" value={dp} />
      <input type="hidden" name="keterangan" value={keterangan} />
      <input type="hidden" name="newCustomerName" value={newCustomer.name} />
      <input type="hidden" name="newCustomerPhone" value={newCustomer.phone} />
      <input type="hidden" name="newCustomerAddress" value={newCustomer.address} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="mb-0">Pelanggan</Label>
          <button
            type="button"
            onClick={() => setNewCustomerMode((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {newCustomerMode ? "Pilih pelanggan existing" : "Pelanggan baru"}
          </button>
        </div>
        {newCustomerMode ? (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <Input placeholder="Nama pelanggan" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
            <Input placeholder="No. HP (contoh: 081234567890)" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            <Input placeholder="Alamat (opsional)" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} />
          </div>
        ) : (
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama} · {c.noHp}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <Label>Item Layanan</Label>
        <div className="space-y-2">
          {items.map((it, idx) => {
            const serv = serviceMap.get(it.serviceId);
            return (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={it.serviceId}
                  onChange={(e) => updateItem(idx, { serviceId: e.target.value })}
                  className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({formatIDR(s.harga)}/{s.satuan === "KG" ? "kg" : "pcs"})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={it.qty}
                  onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                  className="w-20 text-center"
                  aria-label={`Qty item ${idx + 1}`}
                />
                <span className="w-14 text-right text-xs text-slate-400">{serv?.satuan === "KG" ? "kg" : "pcs"}</span>
                <span className="w-20 text-right text-sm font-medium text-slate-700">
                  {formatIDR(serv ? Math.round(it.qty * serv.harga) : 0)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Hapus item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addItem}>
          <Plus className="h-4 w-4" /> Tambah item
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
        <span className="text-sm font-medium text-slate-500">Total</span>
        <span className="text-xl font-bold text-teal-700">{formatIDR(total)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status Order</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {Object.entries(ORDER_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Status Pembayaran</Label>
          <select
            value={statusBayar}
            onChange={(e) => setStatusBayar(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusBayar === "DP" && (
        <div>
          <Label>Nominal DP (Rp)</Label>
          <Input type="number" min={0} value={dp} onChange={(e) => setDp(e.target.value)} placeholder="misal: 50000" />
        </div>
      )}

      <div>
        <Label>Keterangan (opsional)</Label>
        <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Catatan tambahan, misal: jemput cucian" />
      </div>

      <FormError msg={state?.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>Batal</Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Order
        </Button>
      </div>
    </form>
  );
}
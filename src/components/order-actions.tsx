"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, CheckCheck, Pencil, Loader2, Trash2, ExternalLink, CreditCard, ArrowRight, Lock } from "lucide-react";
import {
  updateOrderStatus,
  updateOrderPayment,
  markOrderContacted,
  editOrderItems,
  deleteOrder,
} from "@/actions/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { FormError } from "@/components/ui/label";
import { waLink, waMessage, formatIDR } from "@/lib/utils";
import { ORDER_STATUS, ORDER_STATUS_SEQUENCE, PAYMENT_STATUS } from "@/lib/constants";

type Item = { id: string; serviceId: string; qty: number; service: { nama: string; satuan: string; harga: number } };

type ActiveRow = {
  nama: string;
  satuan: string;
  harga: number;
  aktif: boolean;
  id: string;
};

export function OrderActions({
  orderId,
  noOrder,
  customer,
  status,
  statusBayar,
  dpValue,
  total,
  waContacted,
  items,
  services,
}: {
  orderId: string;
  noOrder: string;
  customer: { nama: string; noHp: string };
  status: string;
  statusBayar: string;
  dpValue: number;
  total: number;
  waContacted: boolean;
  items: Item[];
  services: ActiveRow[];
}) {
  const router = useRouter();
  const [waModalOpen, setWaModalOpen] = React.useState(false);
  const [waText, setWaText] = React.useState("");
  const [editingItems, setEditingItems] = React.useState(false);
  const [existingItems, setExistingItems] = React.useState<Item[]>(items);
  const [itemError, setItemError] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [newPay, setNewPay] = React.useState(statusBayar);
  const [dp, setDp] = React.useState(String(dpValue));
  const [saving, setSaving] = React.useState(false);
  const [payError, setPayError] = React.useState("");

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const sisa = Math.max(total - (statusBayar === "DP" ? dpValue : 0), 0);

  function advance(next: string) {
    updateOrderStatus(orderId, next);
    router.refresh();
  }

  async function savePayment() {
    setSaving(true);
    setPayError("");
    const res = await updateOrderPayment(orderId, newPay, Number(dp) || 0);
    setSaving(false);
    if (res && "error" in res && res.error) {
      setPayError(res.error);
      return;
    }
    router.refresh();
  }

  async function saveItems() {
    const payload = JSON.stringify(
      existingItems.map((it) => ({ serviceId: it.serviceId, qty: Number(it.qty) }))
    );
    const formData = new FormData();
    formData.set("items", payload);
    const res = await editOrderItems(orderId, formData);
    if (res?.error) {
      setItemError(res.error);
      return;
    }
    setEditingItems(false);
    router.refresh();
  }

  function openWa() {
    setWaText(
      waMessage({
        nama: customer.nama,
        noOrder,
        total,
        paymentStatus: statusBayar,
        dp: dpValue,
      })
    );
    setWaModalOpen(true);
  }

  return (
    <>
      <div className="space-y-5">
        {/* Status order */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-teal-600" />
            <h4 className="text-sm font-semibold text-slate-800">Status Order</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUS_SEQUENCE.map((s) => {
              const active = status === s;
              const label = ORDER_STATUS[s].label;
              const reached =
                ORDER_STATUS_SEQUENCE.indexOf(s) <=
                ORDER_STATUS_SEQUENCE.indexOf(status as (typeof ORDER_STATUS_SEQUENCE)[number]);
              return (
                <button
                  key={s}
                  onClick={() => advance(s)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-teal-600 bg-teal-600 text-white"
                      : reached
                        ? "border-teal-300 bg-teal-50 text-teal-700 hover:border-teal-500"
                        : "border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pembayaran */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-teal-600" />
            <h4 className="text-sm font-semibold text-slate-800">Pembayaran</h4>
          </div>

          <div className="mb-4 space-y-2 rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total tagihan</span>
              <span className="font-semibold text-slate-800">{formatIDR(total)}</span>
            </div>
            {statusBayar === "DP" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">DP dibayar</span>
                <span className="font-semibold text-amber-600">{formatIDR(dpValue)}</span>
              </div>
            )}
            {statusBayar === "LUNAS" ? (
              <div className="mt-1 flex items-center justify-between rounded-md bg-emerald-100/70 px-2.5 py-1.5">
                <span className="text-sm font-medium text-emerald-700">Status</span>
                <span className="text-sm font-bold text-emerald-700">Lunas</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between rounded-md bg-rose-100/70 px-2.5 py-1.5">
                <span className="text-sm font-medium text-rose-700">Kekurangan</span>
                <span className="text-base font-bold text-rose-600">{formatIDR(sisa)}</span>
              </div>
            )}
          </div>

          {statusBayar === "LUNAS" ? (
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-100/70 px-3 py-2.5 text-sm font-medium text-emerald-700">
              <Lock className="h-4 w-4" /> Pembayaran sudah LUNAS & terkunci
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <select
                value={newPay}
                onChange={(e) => {
                  setNewPay(e.target.value);
                  setPayError("");
                }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              {newPay === "DP" && (
                <Input
                  type="text"
                  inputMode="numeric"
                  value={dp}
                  onChange={(e) => setDp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Nominal DP (Rp)"
                />
              )}
              <Button className="w-full" onClick={savePayment} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Pembayaran
              </Button>
            </div>
          )}

          {payError && <p className="mt-3 text-sm text-rose-600">{payError}</p>}

          {(statusBayar === "DP" || statusBayar === "BELUM_LUNAS") && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Saat pelanggan melunasi, pilih status <b>Lunas</b>. Nominal DP yang sudah masuk akan
              direset dan total otomatis dicatat sebagai pemasukan.
            </p>
          )}
        </div>

        {/* WhatsApp */}
        {(status === "SELESAI" || status === "DIAMBIL") && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
            <p className="text-sm font-semibold text-emerald-800">Cucian siap diambil</p>
            <p className="mt-1 text-xs text-emerald-700">
              Pesan WhatsApp terisi otomatis — tinggal kirim.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="success" onClick={openWa}>
                <MessageCircle className="h-4 w-4" /> Chat via WhatsApp
              </Button>
              {!waContacted ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await markOrderContacted(orderId);
                    router.refresh();
                  }}
                >
                  <CheckCheck className="h-4 w-4" /> Tandai sudah dihubungi
                </Button>
              ) : (
                <Badge className="w-full justify-center bg-emerald-600 py-1.5 text-white ring-emerald-600">
                  Sudah dihubungi
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Aksi lain */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" size="sm" onClick={() => setEditingItems(true)}>
            <Pencil className="h-4 w-4" /> Ubah Item
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" /> Hapus Order
          </Button>
        </div>
      </div>

      {/* WA preview modal */}
      <Modal open={waModalOpen} onClose={() => setWaModalOpen(false)} title="Preview Pesan WhatsApp">
        <textarea
          value={waText}
          onChange={(e) => setWaText(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <ExternalLink className="h-3.5 w-3.5" /> Pesan akan terbuka di WhatsApp dengan nomor{" "}
          {customer.noHp}. Kamu bisa mengedit pesan di atas sebelum dikirim.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setWaModalOpen(false)}>
            Batal
          </Button>
          <a href={waLink(customer.noHp, waText)} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="success">
              <MessageCircle className="h-4 w-4" /> Buka WhatsApp
            </Button>
          </a>
        </div>
      </Modal>

      {/* Edit items modal */}
      <Modal open={editingItems} onClose={() => setEditingItems(false)} title="Ubah Item Order">
        <div className="space-y-2">
          {existingItems.map((it, idx) => {
            const serv = serviceMap.get(it.serviceId);
            return (
              <div key={it.id ?? idx} className="flex items-center gap-2">
                <select
                  value={it.serviceId}
                  onChange={(e) => {
                    setExistingItems((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, serviceId: e.target.value } : p))
                    );
                  }}
                  className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {services.map((s) => (
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
                  onChange={(e) =>
                    setExistingItems((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, qty: Number(e.target.value) } : p))
                    )
                  }
                  className="w-20 text-center"
                />
                <span className="w-20 text-right text-sm font-medium">
                  {formatIDR(Math.round(it.qty * (serv?.harga ?? 0)))}
                </span>
              </div>
            );
          })}
        </div>
        <FormError msg={itemError} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditingItems(false)}>
            Batal
          </Button>
          <Button type="button" onClick={saveItems}>
            Simpan Perubahan
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteOrder(orderId);
          router.push("/orders");
          router.refresh();
        }}
        title="Hapus order?"
        message={`Order ${noOrder} akan dihapus permanen beserta item & pembayarannya.`}
      />
    </>
  );
}
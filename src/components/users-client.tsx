"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { Plus, Power, Trash2, Loader2, KeyRound } from "lucide-react";
import { createUser, toggleUserActive, deleteUser, resetPassword } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormError } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  nama: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
};

export function UsersClient({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [resetFor, setResetFor] = React.useState<UserRow | null>(null);
  const [deleteFor, setDeleteFor] = React.useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [resetMsg, setResetMsg] = React.useState("");

  const [createState, createAction, createPending] = useFormState(createUser, {});

  React.useEffect(() => {
    if (createState?.ok) {
      setCreating(false);
      router.refresh();
    }
  }, [createState, router]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Dibuat</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{u.nama}</p>
                    {u.id === currentUserId && (
                      <p className="text-xs text-teal-600">Anda</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge className={u.role === "OWNER" ? "bg-slate-800 text-white ring-slate-800" : "bg-teal-100 text-teal-700 ring-teal-200"}>
                      {u.role === "OWNER" ? "Owner" : "Kasir"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={u.active ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}>
                      {u.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setResetFor(u); setNewPassword(""); setResetMsg(""); }}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Reset password"
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      {u.role !== "OWNER" && (
                        <button
                          onClick={async () => {
                            const res = await toggleUserActive(u.id, !u.active);
                            if (res?.error) alert(res.error);
                            router.refresh();
                          }}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Aktif/nonaktif"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      )}
                      {u.role !== "OWNER" && (
                        <button
                          onClick={() => setDeleteFor(u)}
                          className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Hapus pengguna"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Tambah Pengguna">
        <form action={createAction} className="space-y-4">
          <div>
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" name="nama" required placeholder="Nama lengkap" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="nama@laundry.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} placeholder="Minimal 6 karakter" />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select id="role" name="role" defaultValue="KASIR" className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="KASIR">Kasir / Staff</option>
              <option value="OWNER">Owner (Akses penuh)</option>
            </select>
          </div>
          <FormError msg={createState?.error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Batal</Button>
            <Button type="submit" disabled={createPending}>
              {createPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetFor} onClose={() => setResetFor(null)} title={`Reset Password - ${resetFor?.nama ?? ""}`}>
        <form
          action={async () => {
            const formData = new FormData();
            formData.set("password", newPassword);
            const res = await resetPassword(resetFor!.id, formData);
            if (res?.error) setResetMsg(res.error);
            else {
              setResetFor(null);
              router.refresh();
            }
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="np">Password Baru</Label>
            <Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Minimal 6 karakter" />
          </div>
          <FormError msg={resetMsg} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setResetFor(null)}>Batal</Button>
            <Button type="submit">Simpan Password</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={async () => {
          const res = await deleteUser(deleteFor!.id);
          if (res?.error) alert(res.error);
          router.refresh();
        }}
        title="Hapus pengguna?"
        message={`Akun "${deleteFor?.nama}" (${deleteFor?.role === "OWNER" ? "Owner" : "Kasir"}) akan dihapus.`}
      />
    </div>
  );
}
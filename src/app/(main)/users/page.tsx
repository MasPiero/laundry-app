import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "@/components/users-client";

export default async function UsersPage() {
  const user = await requireOwner();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola akun kasir/staff. Hanya Owner yang dapat mengakses halaman ini.
        </p>
      </div>
      <UsersClient users={users} currentUserId={user.id} />
    </div>
  );
}
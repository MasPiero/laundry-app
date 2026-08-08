import { getServerSession, Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export type AuthUser = { id: string; nama: string; email: string; role: "OWNER" | "KASIR" };

export async function getSessionUser(
  session: Session | null = null
): Promise<AuthUser | null> {
  const s = session ?? (await getServerSession(authOptions));
  if (!s?.user?.id) return null;
  return {
    id: s.user.id,
    nama: s.user.name ?? "User",
    email: s.user.email ?? "",
    role: (s.user.role as "OWNER" | "KASIR" | undefined) ?? "KASIR",
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOwner(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== "OWNER") redirect("/");
  return user;
}
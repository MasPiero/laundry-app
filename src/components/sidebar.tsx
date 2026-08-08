"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Users,
  Scissors,
  Wallet,
  UserCog,
  Menu,
  X,
  LogOut,
  Shirt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/services", label: "Layanan", icon: Scissors },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/users", label: "Pengguna", icon: UserCog, ownerOnly: true },
];

export function Sidebar({ nama, role }: { nama: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const items = NAV_ITEMS.filter((i) => !i.ownerOnly || role === "OWNER");

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = isActive(item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-teal-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="flex items-center gap-2 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
        <Shirt className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">LaundryKu</p>
        <p className="text-xs text-slate-400">Manajemen Laundry</p>
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-slate-800 p-4">
      <div className="mb-3 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
          {nama.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{nama}</p>
          <p className="text-xs capitalize text-slate-400">
            {role === "OWNER" ? "Owner" : "Kasir"}
          </p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
      >
        <LogOut className="h-5 w-5" />
        Keluar
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Shirt className="h-4 w-4" />
          </div>
          <span className="text-base font-bold text-slate-800">LaundryKu</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Buka menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        {header}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {header}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-800"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
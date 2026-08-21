import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { Shirt, ClipboardList, Wallet, MessageCircle } from "lucide-react";

const FEATURES = [
  { icon: ClipboardList, title: "Kelola Order & Status", desc: "Lacak cucian dari diterima sampai diambil." },
  { icon: Wallet, title: "Keuangan Otomatis", desc: "Laporan pemasukan & pengeluaran langsung jadi." },
  { icon: MessageCircle, title: "Notifikasi WhatsApp", desc: "Info cucian siap diambil sekali klik." },
];

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen">
      {/* Panel kiri: gambar + branding (desktop) */}
      <div className="relative hidden overflow-hidden lg:block lg:w-[45%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-bg.svg"
          alt="Ilustrasi LaundryKu"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-teal-900/30 to-black/20" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg backdrop-blur">
              <Shirt className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">LaundryKu</span>
          </div>

          <div>
            <h2 className="max-w-md text-4xl font-bold leading-tight text-white">
              Kelola laundry Anda jadi lebih mudah.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-teal-100/90">
              Satu aplikasi untuk order, status cucian, pembayaran, dan laporan keuangan toko laundry Anda.
            </p>

            <ul className="mt-10 space-y-5">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-teal-100/80">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-teal-100/60">© 2026 LaundryKu</p>
        </div>
      </div>

      {/* Panel kanan: form login */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
        {/* Background untuk layar kecil */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-bg.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover lg:hidden"
        />
        <div className="absolute inset-0 bg-slate-950/70 lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
              <Shirt className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-white">LaundryKu</h1>
            <p className="mt-1 text-sm text-slate-300">Aplikasi manajemen laundry & keuangan</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
            <div className="mb-6 hidden lg:block">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">Selamat datang kembali</h1>
              <p className="mt-1 text-sm text-slate-500">Masuk untuk mengelola laundry Anda.</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

# LaundryKu — Aplikasi Manajemen Laundry

Aplikasi full-stack untuk mengelola usaha laundry (pelanggan, order, layanan,
keuangan, laporan, dan notifikasi WhatsApp manual) sesuai PRD-Aplikasi-Laundry.md.

Tech stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma (SQLite) + NextAuth (Credentials) + Recharts + exceljs/pdf-lib**.

> Catatan: database memakai SQLite agar mudah dijalankan lokal tanpa instalasi.
> Untuk produksi tinggal ganti `provider = "postgresql"` di `prisma/schema.prisma`
> dan `DATABASE_URL` di `.env`.

## Menjalankan

```bash
npm install
npm run db:push        # buat tabel + generate Prisma Client
npm run db:seed        # data awal (user demo, layanan, contoh order)
npm run dev            # http://localhost:3000
```

Build & jalankan mode produksi:

```bash
npm run build
npm run start
```

## Akun Demo

| Role  | Email              | Password |
|-------|--------------------|----------|
| Owner | owner@laundry.com  | owner123 |
| Kasir | kasir@laundry.com  | kasir123 |

Owner memiliki akses penuh termasuk menu **Pengguna**; Kasir terbatas pada
dashboard, pelanggan, layanan, order, dan keuangan.

## Fitur Utama

- **Dashboard** — ringkasan omzet hari ini, order aktif, siap diambil, tren pemasukan vs pengeluaran 30 hari.
- **Pelanggan** — CRUD + pencarian + jumlah order.
- **Layanan** — CRUD harga/satuan (kg/pcs), aktif/nonaktif.
- **Order** — buat order multi-item dengan auto-hitungan total, status
  (Diterima → Diproses → Selesai → Diambil), pembayaran (Belum Lunas/Lunas/DP),
  cetak struk, riwayat & filter.
- **WhatsApp manual** — tombol "Chat via WhatsApp" muncul saat order **Selesai**,
  membuka modal preview yang bisa diedit, lalu menuju `wa.me/{no_hp}` dengan pesan terisi otomatis (tidak terkirim otomatis). Ada penanda "Belum dihubungi".
- **Keuangan** — pemasukan otomatis dari order lunas, input pengeluaran manual,
  laporan harian/mingguan/bulanan/custom, grafik, export **Excel** & **PDF**.
- **Pengguna** — kelola akun kasir/staff (khusus Owner).

## Struktur Penting

```
prisma/schema.prisma      # skema database + enum string
prisma/seed.ts            # data demo
src/lib/                  # prisma client, auth (NextAuth), helpers, konstanta
src/actions/              # server actions (customer, service, order, expense, user)
src/app/(main)/           # halaman aplikasi yang dilindungi auth
src/app/login/            # halaman login
src/app/api/report/export # export laporan Excel/PDF
src/components/           # UI + komponen klien (form, tabel, modal)
```

# LaundryKu — Panduan Instalasi di Komputer Lain & Cara Upload ke Hosting

Panduan ini menjelaskan cara membawa aplikasi **LaundryKu** ke laptop/PC lain, dan
cara meng-upload/deploy ke hosting agar bisa diakses dari mana saja.

**Ringkasan teknis:**

| Bagian | Teknologi |
|--------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | SQLite (`prisma/dev.db`) — *paling mudah dibawa-bawa* |
| Auth | NextAuth (Credentials, JWT) |
| Export laporan | exceljs (Excel) & pdf-lib (PDF) |
| Grafik | Recharts |

---

## Bagian 1: Pindah ke Laptop/PC Lain

### 1.1 Salin folder proyek

Salin seluruh folder `laundry-app` (kecuali folder yang tidak perlu). Hal yang
hanya ada di komputer lama dan **jangan dihitung sebagai perubahan kode:**

```
laundry-app/
├── .env                      # WAJIB disalin (patokan database + secret)
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db               # data bisnis Anda (pelanggan, order, keuangan)
├── src/                     # seluruh kode aplikasi
├── package.json
└── ...
```

> 💡 **Tidak perlu disalin**: folder `node_modules`, `.next`, dan `package-lock.json`
> — di komputer baru nanti dibuat ulang otomatis dengan `npm install`.

### 1.2 Prasyarat di komputer baru

- **Node.js** versi 18 atau lebih baru. Cek: `node -v`
- **npm** (ikut terpasang bersama Node.js). Cek: `npm -v`

Kalau belum ada, unduh di <https://nodejs.org> (pilih versi **LTS**).

### 1.3 Instalasi & menjalankan

Di dalam folder `laundry-app`, jalankan perintah berikut satu per satu:

```bash
npm install        # menginstal semua library sesuai package.json
npm run db:push    # membuat tabel + meng-generate Prisma Client
npm run db:seed    # (opsional) memasukkan data contoh, jika belum ada data
npm run dev        # menjalankan di http://localhost:3000
```

- Pertama kali jalan pasti pakai `http://localhost:3000`.
- Jika `dev.db` ikut disalin → **skip `db:seed`** agar data lama tetap terjaga.
  Jika databasenya belum ada (mis. `db:push` membuat file baru), jalankan
  `npm run db:seed` untuk mengisi data awal.

### 1.4 Akun login

| Role  | Email             | Password |
|-------|-------------------|----------|
| Owner | owner@laundry.com | owner123 |
| Kasir | kasir@laundry.com | kasir123 |

---

## Bagian 2: Upload ke Hosting (jadi bisa diakses internet)

Ada 2 arah yang akan dijelaskan: **(A)** pakai platform PaaS yang paling
ramah-pemula, dan **(B)** pakai VPS (server virtual sendiri).

> ⚠️ **Pilihan database penting di sini.** Aplikasi ini memakai **SQLite**
> (satu file `dev.db`). SQLite itu simpan di *storage-nya host*; platform
> serverless bisa bersifat non‑persisten — data berisiko HILANG saat server
> restart. Oleh sebab itu untuk hosting kami **rekomendasikan beralih ke
> PostgreSQL**.

---

### Bagian 2.A — Deploy di platform PaaS (paling mudah), mis. Railway / Render

Contoh ini menggunakan **Railway** (ada paket gratis). Konsepnya sama untuk
**Render**, **Fly.io**, dsb.

**Langkah 1 — siapkan kode untuk serverless.**

Buka `laundry-app/.env` dan edit:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/laundry?schema=public"
NEXTAUTH_SECRET="<ganti-dengan-string-random-panjang>"
NEXTAUTH_URL="https://nama-app-anda.up.railway.app"
```

Lalu ganti provider pada `prisma/schema.prisma`:

```
datasource db {
  provider = "postgresql"      // ganti dari "sqlite"
  url      = env("DATABASE_URL")
}
```

(Langkah cepat cukup pakai `prisma db push`; untuk produksi sebaiknya buat
migrasi dengan `prisma migrate dev`.)

**Langkah 2 — generate Prisma Client & build:**

```bash
npx prisma generate
npm run build
```

**Langkah 3 — buat repo Git dan push:**

```bash
git init
git add .
git commit -m "deploy LaundryKu"
git remote add origin https://github.com/Anda/nama-repo.git
git push -u origin main
```

**Langkah 4 — deploy di Railway:**

1. Buka <https://railway.app>, login dengan GitHub/GitLab.
2. Klik **New Project → Deploy from GitHub repo**.
3. Pilih repo LaundryKu Anda; Railway otomatis mendeteksi Next.js.
4. Tambahkan variabel environment (`DATABASE_URL`, `NEXTAUTH_SECRET`,
   `NEXTAUTH_URL`) pada tab **Variables**.
5. Tambahkan **Add Database → PostgreSQL** (Railway membuatkan URL otomatis,
   isikan ke `DATABASE_URL`).
6. Pada **Build/Settings**, jalankan perintah:
   - Build Command: `npx prisma generate && npx prisma db push && npm run build`
   - Start Command: `npm run start`
7. Deploy → Railway membuat URL publik, langsung bisa diakses.

> 💡 Bila ingin mengisi data awal sekali saja, jalankan dari laptop:
> `npx prisma db seed`.

---

### Bagian B — Deploy di VPS (cara tradisional, yang paling bebas)

**Siapkan VPS** (mis. Ubuntu 22.04) — banyak pilihan: DigitalOcean, Vultr,
Hetzner, IDCloudHost.

**Langkah 1 — instal kebutuhan di VPS:**

```bash
sudo apt update && sudo apt install -y nginx curl git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Langkah 2 — buat user & lokasi proyek:**

```bash
adduser laundry
usermod -aG sudo laundry
mkdir /var/www/laundry
chown laundry:laundry /var/www/laundry
cd /var/www/laundry
# lalu masukkan kode (via git clone atau upload file)
sudo -u laundry git clone https://github.com/Anda/repo-laundry.git .
```

**Langkah 3 — install & build:**

```bash
cd /var/www/laundry
npm install
# lalu isi .env  (DATABASE_URL sqlite / postgres sesuai pilihan)
npm run db:push
npm run db:seed   # opsional
npm run build
```

**Langkah 4 — jalankan otomatis dengan systemd:**

Buat file `/etc/systemd/system/laundry.service`:

```ini
[Unit]
Description=LaundryKu
After=network.target

[Service]
User=laundry
WorkingDirectory=/var/www/laundry
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Lalu aktifkan:

```bash
sudo systemctl daemon-reload
sudo systemctl enable laundry
sudo systemctl start laundry
# cek status
sudo systemctl status laundry
```

**Langkah 5 — nginx sebagai reverse-proxy:**

```nginx
server {
    listen 80;
    server_name laundry.andady.com;   # atau IP VPS

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/laundry /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

App bisa diakses di `http://IP-VPS` atau `http://domain-anda`.

---

## Catatan penting (ringkasan)

- **Database di awal:** data lama ada di `prisma/dev.db`. Setelah migrasi ke
  PostgreSQL, tabel akan kosong → jalankan `npx prisma db seed` lalu input ulang
  data nyata, atau lakukan migrasi data secara terpisah (mis. pakai `pgloader`
  untuk SQLite → PostgreSQL).
- **`NEXTAUTH_SECRET`** harus di-set dan kuat. Generate dengan
  `openssl rand -base64 32`.
- **`NEXTAUTH_URL`** harus sesuai domain yang dipakai (tanpa `/` di akhir).
- **HTTPS:** Railway/Render sudah otomatis; untuk VPS pakai Let's Encrypt
  (certbot).
- **Jangan pernah meng-upload `.env`** ke repo publik (pastikan `.env` ada di
  `.gitignore`).
- **Database file SQLite** `prisma/dev.db` sebaiknya di- **backup** periodik
  (cukup copy file-nya).
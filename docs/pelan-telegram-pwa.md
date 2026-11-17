# Pelan & Status: Bot Telegram + PWA Kemaskini Kandungan

Dokumen ini menyimpan keputusan, status sebenar dan pelan pelaksanaan untuk dua
bahagian sistem yang belum siap. Ia ditulis supaya kerja boleh disambung semula
tanpa perlu mengulang siasatan.

Tarikh kemas kini: **17 November 2026**

---

## 1. Ringkasan status

| Komponen | Status | Bukti / lokasi |
|---|---|---|
| Widget chatbot di laman | **Siap, produksi** | `js/modules/chatbot/*`, `css/chatbot.css`, `css/orientasi.css` |
| Proksi tempatan | Siap | `tools/chat-proxy.mjs` (port 8787) |
| Cloudflare Worker chatbot | **Siap, deployed** | `https://asyariff-bot.asyariff-kafa.workers.dev` |
| Endpoint produksi di laman | **Siap** | `data/chatbot.json` → `endpoint.produksi` |
| Bot Telegram | **Belum** | Worker `/telegram/webhook` sudah ada, rahsia belum ditetapkan |
| PWA kemaskini kandungan | **Belum dibina** | Pelan di bahagian 5 |
| Remote MCP (FileBridge) | Siap, berasingan | Lihat `README.md` bahagian *Remote MCP untuk Claude.ai* |
| Paparan pelbagai orientasi | Siap | Commit `990ffa5`, diuji pada 390×844, 667×375, 844×390, 932×430, 360×640 |

### Ujian produksi yang sudah lulus

```text
GET  /health
200 {"ok":true,"model":"nvidia/nemotron-3-ultra-550b-a55b",
     "nvidia":true,"telegram":false,"site_origin":true}

POST /api/chat  (Origin: https://kafaiassyariffklgt-edu.github.io)
200  content-type: text/event-stream
     access-control-allow-origin: https://kafaiassyariffklgt-edu.github.io
     token jawapan pertama ~2.6 s, jumlah ~3.1 s
```

Laman awam sudah memuat turun `data/chatbot.json` dengan URL Worker yang betul,
jadi butang **ASY-SYARIFF BOT** di laman GitHub Pages kini berfungsi dalam talian.

---

## 2. Seni bina sasaran

```text
Pelayar (GitHub Pages, statik)
   └── widget ASY-SYARIFF BOT ── POST /api/chat ──┐
                                                  │
Telegram (webhook)                                ├── Worker "asyariff-bot"
   └── POST /telegram/webhook ───────────────────┘        └── NVIDIA NIM
                                                          └── data/chatbot*.json

PWA pentadbir (telefon/desktop)                   Worker "asyariff-admin" (baharu)
   └── log masuk kata laluan ── cookie HMAC ──────┤
   └── borang program/berita ─────────────────────┴── GitHub Contents API
                                                        └── commit ke repo → GitHub Pages
```

Prinsip yang dikekalkan:

- Laman awam kekal **statik** (tiada build step, tiada pangkalan data di pelayar).
- **Tiada** kunci API atau token GitHub di dalam HTML/JS awam.
- Semua rahsia dalam Worker secret (`wrangler secret put`).
- Bahasa dan gaya UI mengikut modul sedia ada (BM, token warna dalam `css/variables.css`).

---

## 3. Bot Telegram — langkah yang tinggal

Panduan penuh sudah ada di `worker/README.md` §3. Ringkasan tindakan:

1. **Cipta bot** di Telegram: `@BotFather` → `/newbot` → simpan token
   (format `123456789:AA...`). Ini hanya boleh dilakukan oleh pemilik akaun Telegram.
2. **Tetapkan rahsia** dari folder `worker/`:

   ```powershell
   npx wrangler secret put TELEGRAM_BOT_TOKEN      # tampal token BotFather
   npx wrangler secret put TELEGRAM_WEBHOOK_SECRET #jana: [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
   npx wrangler deploy
   ```

3. **Daftar webhook** (sekali sahaja, selepas secret disimpan):

   ```powershell
   $TOKEN  = "<token BotFather>"
   $SECRET = "<rahsia webhook yang sama>"
   $URL    = "https://asyariff-bot.asyariff-kafa.workers.dev/telegram/webhook"

   Invoke-RestMethod "https://api.telegram.org/bot$TOKEN/setWebhook" -Method Post -Body @{
     url             = $URL
     secret_token    = $SECRET
     allowed_updates = '["message","callback_query"]'
   }
   ```

4. **Pautan awam** dalam `data/chatbot.json`:

   ```json
   "telegram": "https://t.me/<username_bot>"
   ```

   Widget akan memaparkan pautan ini sebagai pilihan tambahan.

5. **Uji**: `/health` mesti pulang `"telegram": true`, kemudian hantar
   `/start`, `/menu`, `/reset`, `/help` kepada bot.

Pilihan keselamatan: hadkan kepada pentadbir sahaja melalui
`TELEGRAM_ALLOWED_CHAT_IDS` dalam `worker/wrangler.toml` (kosong = awam).

> Nota: menu bot dibaca daripada `data/chatbot.json` yang sama dengan widget web.
> Sebarang perubahan menu diambil dalam masa ~5 minit (cache Worker), tanpa deploy.

---

## 4. Keputusan yang belum dibuat

Tiga keputusan ini menentukan bentuk PWA. Cadangan saya di sebelah kanan.

| # | Keputusan | Pilihan | Cadangan |
|---|---|---|---|
| 1 | Tempat simpan data | Commit ke GitHub **atau** Cloudflare KV | **GitHub commit** — laman kekal statik, ada sejarah versi, tiada perubahan pada kod laman |
| 2 | Cara log masuk | Kata laluan admin + cookie HMAC **atau** Cloudflare Access | **Kata laluan + cookie HMAC** — tiada domain sendiri diperlukan |
| 3 | Kandungan boleh edit | Program, aktiviti/berita, pengumuman, maklumat & statistik | **Program + aktiviti/berita + pengumuman** dahulu |

Jika pilihan 1 ditukar kepada KV, laman perlu diubah supaya membaca data dinamik
dari Worker dan `data/*.json` menjadi sandaran sahaja. Itu menambah kerja pada
setiap modul paparan dan menjejaskan masa muat pertama.

---

## 5. Pelan PWA kemaskini kandungan (reka bentuk disyorkan)

### 5.1 Komponen

| Komponen | Lokasi | Fungsi |
|---|---|---|
| Worker admin | `admin-worker/` (baharu) | API + hos aset PWA, worker berasingan daripada bot |
| Aplikasi PWA | `admin/` (baharu) | `index.html`, `app.js`, `admin.css`, `manifest.webmanifest`, `sw.js`, ikon |
| Skema & pengesahan | `admin-worker/skimas.mjs` | Sahkan bentuk JSON sebelum commit |
| Dokumen | `admin-worker/README.md` | Deploy, secret, sandaran, pemulihan |

Worker berasingan dipilih supaya kredential pentadbir **tidak** berkongsi
blast radius dengan proksi chat awam.

### 5.2 API

| Kaedah | Laluan | Fungsi |
|---|---|---|
| `POST` | `/api/sesi` | Log masuk (`{kataLaluan}`) → cookie `sid` HttpOnly, Secure, SameSite=Strict, 8 jam |
| `DELETE` | `/api/sesi` | Log keluar |
| `GET` | `/api/saya` | Semak sesi semasa |
| `GET` | `/api/kandungan/:nama` | Baca JSON + `sha` semasa daripada GitHub |
| `PUT` | `/api/kandungan/:nama` | `{data, sha, mesej}` → sahkan → commit ke GitHub |
| `GET` | `/api/kandungan/:nama/sejarah` | 10 commit terakhir fail itu |
| `POST` | `/api/imej` | (Fasa 2) muat naik gambar ke `assets/img/`, had 2 MB, jenis `jpg/png/webp` |

`:nama` dihadkan kepada senarai putih: `program`, `aktiviti`, `berita`,
`ticker`, `sekolah`. Laluan lain ditolak dengan `404`.

### 5.3 Skema data (berdasarkan fail sebenar)

```jsonc
// data/program.json — kalendar ringkas
[{ "id": 1, "tarikh": "2026-11-16", "tajuk": "Raptai Khatam",
   "kategori": "Majlis", "catatan": "pilihan", "cadangan": true }]

// data/aktiviti.json — kad aktiviti + butiran
[{ "id": 1, "slug": "raptai-khatam-2026", "tarikh": "2026-11-16",
   "tajuk": "Raptai Khatam", "kategori": "Majlis", "status": "disahkan",
   "ringkas": "...", "caption": "...", "sumber": "...",
   "sorotan": 1, "laporan": "pages/program.html?slug=...",
   "gambar": [{ "src": "...", "alt": "..." }] }]

// data/berita.json — bentuk sama seperti aktiviti (kini array kosong)
```

Peraturan pengesahan:

- `tarikh` mesti `YYYY-MM-DD` dan tarikh sah.
- `tajuk` 3–120 aksara, tiada `<` `>`; `ringkas`/`caption` had 600 aksara.
- `kategori` daripada senarai tetap: Majlis, Mesyuarat, Peperiksaan, Kursus,
  Murid & Ibu Bapa, Aktiviti, Sekolah.
- `status` hanya `disahkan` atau `draf`.
- `slug` dijana daripada tajuk, unik, `[a-z0-9-]` sahaja.
- `id` dijana sebagai `max(id) + 1`; tiada id bertindih.
- Saiz fail maksimum 256 KB; jumlah item maksimum 500.

### 5.4 Keselamatan

- Kata laluan dibanding secara masa-tetap (constant-time).
- Sesi: `HMAC-SHA256(payload, SESSION_SECRET)`; tiada sesi disimpan di KV.
- Had kadar log masuk: 5 cubaan / 10 minit setiap IP (in-memory + sandaran KV).
- Semua `PUT`/`POST` memerlukan header `X-Admin-Request: 1` (menghalang CSRF
  borang biasa) + `SameSite=Strict`.
- Token GitHub: fine-grained PAT, **Contents: Read and write** untuk repo
  `kafaiassyariffklgt-edu/website` sahaja. Disimpan sebagai Worker secret.
- Setiap commit menggunakan mesej berformat: `Kandungan: <nama> dikemas kini oleh PWA`.
- Tiada data murid, tiada muat naik dokumen peribadi.

### 5.5 Fasa pelaksanaan

| Fasa | Skop | Hasil boleh diuji |
|---|---|---|
| 1 | Worker admin + log masuk + baca/tulis `program.json` | Tambah satu program, commit muncul di GitHub, laman berubah selepas Pages siap |
| 2 | `aktiviti.json`, `berita.json`, `ticker`, muat naik gambar | Tulis berita bergambar dengan pratonton |
| 3 | PWA: manifest, service worker, ikon, UI telefon | Boleh "Add to Home Screen", buka luar talian (shell), draf disimpan di IndexedDB |
| 4 | Pengerasan: had kadar, audit log, ujian E2E, dokumentasi | Senarai ujian penerimaan di 5.7 lulus |

### 5.6 Fail yang akan disentuh

Baharu:

```text
admin-worker/wrangler.toml
admin-worker/index.js
admin-worker/skimas.mjs
admin-worker/README.md
admin/index.html
admin/app.js
admin/admin.css
admin/manifest.webmanifest
admin/sw.js
admin/ikon/ikon-192.png, ikon-512.png, ikon-maskable-512.png
```

Diubah (minimum):

```text
README.md                  tambah bahagian PWA pentadbir
js/modules/ticker.js       hanya jika pengumuman dijadikan fail berasingan
data/*.json                struktur sedia ada dikekalkan
```

Kod laman awam tidak perlu diubah untuk pilihan simpanan GitHub.

### 5.7 Ujian penerimaan

- [ ] Log masuk salah 6 kali → disekat sementara, mesej jelas.
- [ ] Cookie tidak boleh dibaca JavaScript (`HttpOnly`) dan tidak dihantar dari origin lain.
- [ ] `PUT` tanpa sesi → `401`; dengan sesi tetapi tanpa `X-Admin-Request` → `403`.
- [ ] JSON tidak sah (tarikh salah, tajuk kosong, skrip dalam teks) → `400` dengan mesej medan.
- [ ] Dua peranti menyunting serentak → peranti kedua dapat `409` (sha lama) dan arahan muat semula.
- [ ] Commit muncul dalam sejarah GitHub dengan mesej yang betul.
- [ ] Laman GitHub Pages memaparkan data baharu selepas deployment.
- [ ] PWA boleh dipasang di Android/iOS, membuka shell luar talian, dan menyimpan draf.
- [ ] Saiz bundle PWA < 150 KB (tanpa gambar), masa muat < 2 s pada 4G.

---

## 6. Arahan rujukan

```powershell
# Laman tempatan
node tools/serve.mjs            # http://127.0.0.1:8081/
node tools/chat-proxy.mjs       # http://127.0.0.1:8787/api/chat

# Worker chatbot
cd worker
npx wrangler whoami
npx wrangler secret list
npx wrangler deploy
npx wrangler tail

# Semakan projek & terbit
python tools/check-site.py
node push.js "mesej commit"
```

Semakan produksi pantas:

```powershell
Invoke-RestMethod https://asyariff-bot.asyariff-kafa.workers.dev/health
Invoke-RestMethod https://kafaiassyariffklgt-edu.github.io/website/data/chatbot.json |
  Select-Object -ExpandProperty endpoint
```

---

## 7. Risiko dan perkara terbuka

1. **Kunci NVIDIA pernah terdedah** dalam sembang. Ia masih digunakan atas
   permintaan. Sebelum produksi jangka panjang, jana kunci baharu di
   `build.nvidia.com`, kemas kini `.env` dan Worker secret, kemudian buang kunci lama.
2. **Had kadar Worker** disimpan dalam memori isolate; ia tidak dikongsi antara
   isolate. Untuk produksi ramai pengguna, pindahkan ke KV atau Durable Object.
3. **Telegram token** hanya boleh dicipta oleh pemilik akaun Telegram.
4. **GitHub PAT** mesti dihadkan kepada satu repo dan boleh dibatalkan bila-bila masa.
5. **`data/program.json`** nampaknya tidak dirujuk oleh mana-mana modul JS
   (kalendar menggunakan `data/aktiviti.json`). Perlu audit sebelum PWA menulis
   ke fail itu supaya usaha tidak sia-sia.
6. **Emblem hero** memaparkan latar putih petak kerana fail logo mempunyai latar
   putih (bukan isu orientasi). Boleh dibaiki dengan `mix-blend-mode: multiply`
   atau fail PNG telus.

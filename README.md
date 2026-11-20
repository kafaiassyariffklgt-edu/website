# Laman KAFAI As-Syariff Telok Datok

Laman statik HTML/CSS/JS tanpa proses build untuk **KAFA Integrasi As-Syariff Telok
Datok**, Banting, Kuala Langat. Laman ini masih **draf** dan semua halaman mempunyai
`noindex, nofollow` sehingga pihak sekolah meluluskan penerbitan.

## Struktur

| Laluan | Fungsi |
|---|---|
| `index.html` | Laman utama: hero, sorotan program, program seterusnya, statistik agregat |
| `pages/` | Tentang, kepimpinan, kurikulum, program, pencapaian, kokurikulum, prasarana, hubungi, bahan bacaan, jaringan, berita, tetapan |
| `css/` | Sistem gaya modular; titik masuk `css/style.css` |
| `js/` | Modul ES; titik masuk `js/main.js` |
| `data/` | Data awam: profil sekolah, kepimpinan, kurikulum, program, statistik, carian |
| `assets/` | Lencana, poster sorotan dan fon tempatan |
| `web-api-module/` | Modul masa, kalendar dan waktu solat e-Solat |
| `worker/` | Worker Cloudflare untuk chatbot AI (NVIDIA NIM) dan webhook Telegram |
| `dev/` | Makmal gerak dalaman (`noindex`, tidak dipautkan dari laman awam) |
| `tools/` | Pelayan tempatan, proksi chatbot dan skrip semakan |

## Pembangunan tempatan

```bash
node tools/serve.mjs
# http://127.0.0.1:8081/
```

Untuk chatbot AI, jalankan proksi dalam terminal kedua:

```bash
node tools/chat-proxy.mjs
# http://127.0.0.1:8787/api/chat
```

Proksi membaca `NVIDIA_API_KEY` daripada `.env`. Kunci tidak pernah dihantar ke
pelayar. Panduan produksi dan Telegram: [`worker/README.md`](worker/README.md).

Pelayan menyokong Range untuk pembaca PDF dan tidak menyajikan fail peribadi seperti
`.env`, `kafa-db.json`, `status.txt` atau folder laporan.

## Chatbot AI

Widget **ASY-SYARIFF BOT** terapung di bawah kanan setiap halaman. Ia menggunakan
model NVIDIA Nemotron melalui proksi pelayan; kunci API tidak berada dalam kod
pelayar.

| Fail | Fungsi |
|---|---|
| `data/chatbot.json` | Nama, salam, endpoint, pautan WhatsApp/Telegram dan **menu soalan** |
| `data/chatbot-kontekst.json` | Pangkalan pengetahuan sekolah untuk AI |
| `js/modules/chatbot/` | Widget modular: `api.js`, `render.js`, `index.js` |
| `css/chatbot.css` | Gaya butang dan panel |
| `tools/chat-proxy.mjs` | Proksi tempatan |
| `worker/` | Worker produksi + webhook Telegram |

Tambah atau buang item dalam array `menu` pada `data/chatbot.json` untuk mengubah
senarai soalan pantas. Menu yang sama digunakan oleh widget web dan bot Telegram.

Jawapan AI dihadkan kepada fakta dalam `data/chatbot-kontekst.json`. Maklumat yang
belum disahkan akan dijawab sebagai belum disahkan dan dirujuk kepada sekolah.

> **Keselamatan:** jangan masukkan kunci API ke dalam `data/chatbot.json` atau
> mana-mana fail `js/`. Jika kunci pernah terdedah, jana semula di NVIDIA sebelum
> menerbitkan laman.

### Status produksi dan pelan seterusnya

Worker produksi: `https://asyariff-bot.asyariff-kafa.workers.dev`
(`/api/chat`, `/telegram/webhook`, `/health`).

Bot Telegram dan PWA kemaskini kandungan masih dalam perancangan. Status penuh,
keputusan yang belum dibuat dan pelan pelaksanaan disimpan dalam
[`docs/pelan-telegram-pwa.md`](docs/pelan-telegram-pwa.md).

## Remote MCP untuk Claude.ai

Claude.ai (web) boleh membaca dan menulis fail projek ini melalui pelayan
[FileBridge MCP](https://github.com/WebifyGO/filebridge-mcp) yang berjalan pada
komputer ini dan didedahkan melalui Cloudflare Quick Tunnel.

### Seni bina

```text
Claude.ai  ──HTTPS──>  trycloudflare.com  ──>  cloudflared
                                                    │
                                           127.0.0.1:3000
                                                    │
                                          FileBridge MCP (Node)
                                                    │
                                    C:\Users\rafee\Downloads\KAFA\kafai-website
```

### Fail berkaitan

| Lokasi | Fungsi |
|---|---|
| `C:\Tools\filebridge-mcp\` | Pemasangan FileBridge MCP |
| `C:\Tools\filebridge-mcp\.env` | `PORT`, `BASE_PATH`, `BEARER_TOKEN` (jangan commit) |
| `C:\Tools\bin\cloudflared.exe` | Binari Cloudflare Tunnel |
| `start-filebridge.ps1` | Jalankan pelayan MCP pada port 3000 |
| `start-tunnel.ps1` | Buka Quick Tunnel dan tulis URL ke `mcp-connection.txt` |

### Jalankan

Dua terminal PowerShell 7:

```powershell
.\start-filebridge.ps1
```

```powershell
.\start-tunnel.ps1
```

Selepas beberapa saat, skrip kedua memaparkan URL awam dan menulis butiran
sambungan ke `mcp-connection.txt` (dihadkan kepada pengguna Windows semasa dan
disenaraikan dalam `.gitignore`).

Uji secara tempatan:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
```

### Sambung ke Claude.ai

1. Buka **Settings → Connectors → Add custom connector**.
2. Pilih **Remote MCP**.
3. Masukkan URL penuh **bersama token**:

   ```text
   https://<nama-rawak>.trycloudflare.com/mcp?token=<BEARER_TOKEN>
   ```

   Gunakan URL daripada `mcp-connection.txt`. Endpoint ialah `/mcp`
   (Streamable HTTP), bukan `/sse` atau `/message`.
4. Simpan dan klik **Connect**.

Claude.ai menyokong OAuth secara lalai. Pelayan ini memulangkan `404` pada
endpoint `.well-known` OAuth, jadi Claude melangkau OAuth. Jika akaun anda
mempunyai ciri *static credential* (beta), masukkan token sebagai Bearer;
jika tidak, token dalam URL di atas adalah kaedah yang berfungsi.

> **Nota teknikal:** endpoint `/mcp` menggunakan Streamable HTTP dengan respons
> JSON. Endpoint warisan `/sse` masih tersedia untuk klien desktop, tetapi
> Cloudflare Quick Tunnel membuffer respons SSE sehingga tiada data sampai ke
> klien. Gunakan `/mcp` untuk Claude.ai.

### Alat yang tersedia

`read_file`, `write_file`, `list_files`, `delete_file`, `get_project_structure`,
`search_in_files`, `replace_in_files`, `list_workspaces`.

`run_command` **dimatikan** (`ALLOWED_COMMANDS=` kosong) supaya klien tidak dapat
menjalankan shell di luar kawalan laluan fail.

### Fail yang disekat

Lapisan tambahan dalam `src/utils/denyList.js` menghalang akses kepada:

- `.env`, `.env.*`, `.dev.vars`, `.npmrc`, `.netrc`
- `.git/`, `.wrangler/`, `.pawprints/`, `node_modules/`
- `status.txt`, `Guru dan Murid terkini.txt`, `_laporan/`
- `semak-perkim.*`, `push.js`, `push.bat`, `*.pem`, `*.key`

Sekatan ini terpakai pada baca, tulis, padam, senarai direktori dan carian
seluruh projek. Jika fail baharu perlu dilindungi, tambah namanya dalam
`denyList.js` dan mulakan semula pelayan.

### Amaran keselamatan

- **Quick Tunnel adalah sementara.** URL berubah setiap kali `start-tunnel.ps1`
  dimulakan semula; kemas kini URL dalam Claude.ai selepas itu.
- Sesiapa yang mempunyai URL **dan** token boleh membaca/menulis projek. Jangan
  kongsi `mcp-connection.txt`.
- Folder projek mengandungi `.env` dengan token GitHub/NVIDIA. Walaupun sudah
  disekat oleh `denyList.js`, jangan andaikan lapisan itu sempurna.
- Hentikan terowong apabila tidak digunakan:

  ```powershell
  .\start-tunnel.ps1 -Stop
  ```

- Untuk kegunaan berterusan, gunakan **Named Tunnel** dengan domain sendiri dan
  **Cloudflare Access** (Service Token atau e-mel OTP) dan bukan Quick Tunnel.

## Data satu sumber

Nombor dan maklumat asas sekolah disimpan sekali dalam `data/sekolah.json` dan
`data/statistik.json`, kemudian digunakan oleh laman dan chatbot.

- **Laman:** elemen HTML bertanda `data-bind="statistik.murid.jumlah"` diisi oleh
  `js/modules/data-bind.js`. Teks di dalam elemen ialah nilai sandaran yang kekal jika
  JavaScript mati atau fail JSON gagal dimuat. Nilai dimasukkan sebagai teks, bukan HTML.
- **Chatbot:** fakta `identiti`, `hubungan` dan `statistik` dalam
  `data/chatbot-kontekst.json` dijana daripada fail yang sama:

  ```bash
  node tools/bina-konteks.mjs           # kemas kini konteks bot
  node tools/bina-konteks.mjs --semak   # semak sahaja (kod keluar 1 jika tidak selaras)
  ```

Aliran kerja menukar angka: ubah `data/statistik.json`, jalankan
`node tools/bina-konteks.mjs`, kemudian terbitkan. Fakta lain dalam
`chatbot-kontekst.json` masih disunting dengan tangan.

Senarai data yang masih belum disahkan dan perlu diisi pihak sekolah ada dalam
[`docs/senarai-semak-data-sekolah.md`](docs/senarai-semak-data-sekolah.md).

## Semakan

```bash
python tools/check-site.py
node tools/check-motion.mjs
```

`check-site.py` menyemak pautan, aset, anchor, JSON, CSS `@import`, import JS, metadata
draf, id berganda, rujukan pangkalan data peribadi, corak nombor kad pengenalan dan sisa
jenama PERKIM. `check-motion.mjs` menyemak inventori gerakan dalam `data/motion.json`.

Untuk semakan sintaks modul ES, jalankan setiap fail melalui Node dengan modul:

```bash
node --input-type=module --check < js/main.js
```

## Data dan privasi

- Hanya data peringkat sekolah diterbitkan: profil, kod JAKIM `BYT1005`, mata pelajaran,
  statistik agregat, program dan nama guru/AJK yang disahkan.
- **Tiada data peringkat murid**: nama, nombor kad pengenalan, markah, kehadiran, rekod
  disiplin atau komunikasi tidak disimpan dalam folder awam.
- Nama Guru Besar, JPK, guru dan guru ganti diambil daripada papan pergerakan guru serta
  rekod sekolah. Status kehadiran, cuti dan maklumat peribadi guru tidak disiarkan. Senarai
  AJK 2012–2014 ialah rekod sejarah daripada blog Masjid As-Syarif dan bukan struktur semasa.
- Tarikh penubuhan “sekitar 2000” dan bangunan sendiri “2007” masih memerlukan pengesahan
  pihak sekolah.
- Rekod SIMPENI menyenaraikan aliran Tahfiz, tetapi strukturnya belum disahkan; halaman
  kurikulum menyatakan perkara ini secara terbuka.
- `data/books.json` dan `data/berita.json` sengaja kosong kerana tiada bahan awam yang
  disahkan. Tiada kandungan pihak ketiga atau data rekaan diisi untuk memenuhi ruang.

## Penerbitan

Laman boleh dihoskan di akar domain atau subfolder GitHub Pages. Fail `.nojekyll` sudah
disediakan. Jangan buang `noindex` atau banner draf sehingga penerbitan diluluskan.

Skrip `push.js` / `push.bat` dan fail `.env` dikekalkan untuk aliran kerja sedia ada.
`.env` dan pangkalan data peribadi tidak dimasukkan ke dalam repositori.

## Sumber

- Profil sekolah SIMPENI (kod JAKIM `BYT1005`) dan rekod sekolah.
- `laman-kafa/data`: kurikulum, program dan profil awam.
- Blog Masjid As-Syarif untuk rekod sejarah AJK 2012–2014.
- e-Solat JAKIM (zon `SGR03`) untuk waktu solat.

Tiada kandungan, aset atau data PERKIM digunakan dalam laman ini.

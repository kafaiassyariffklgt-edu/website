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
| `dev/` | Makmal gerak dalaman (`noindex`, tidak dipautkan dari laman awam) |
| `tools/` | Pelayan tempatan dan skrip semakan |

## Pembangunan tempatan

```bash
node tools/serve.mjs
# http://127.0.0.1:8081/
```

Pelayan menyokong Range untuk pembaca PDF dan tidak menyajikan fail peribadi seperti
`.env`, `kafa-db.json`, `status.txt` atau folder laporan.

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

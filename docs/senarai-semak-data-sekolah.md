# Senarai Semak Data Sekolah

Dokumen ini untuk pihak sekolah. Setiap item di bawah masih **belum disahkan** dalam
data awam. Laman dan chatbot tidak akan mengisi tekaan; ruang kekal ditanda "belum
disahkan" sehingga data diterima.

Cara guna: isi lajur **Jawapan**, tandakan **Disahkan oleh** (nama + tarikh), kemudian
serahkan kepada pentadbir laman. Jangan hantar data peribadi murid (nama, no. kad
pengenalan, markah, kehadiran, rekod disiplin).

Keutamaan: **A** = perlu sebelum laman diterbitkan, **B** = patut ada, **C** = tambahan.

## 1. Identiti dan sejarah

| # | Item | Kep. | Jawapan | Disahkan oleh | Fail terlibat |
|---|---|---|---|---|---|
| 1 | Tarikh/tahun penubuhan sebenar (kini "sekitar 2000") | A | | | `data/statistik.json`, `data/sekolah.json`, `pages/tentang.html` |
| 2 | Tahun perolehan bangunan sendiri (kini 2007) | A | | | sama seperti di atas |
| 3 | Teks **visi** rasmi | A | | | `pages/tentang.html` |
| 4 | Teks **misi** rasmi | A | | | `pages/tentang.html` |
| 5 | Objektif / piagam pelanggan (jika ada) | C | | | `pages/tentang.html` |
| 6 | Nama Guru Besar dan jawatan rasmi (profil SIMPENI: Pengetua / Ketua Guru) | A | | | `data/kepimpinan.json`, `data/sekolah.json` |

## 2. Operasi dan hubungan

| # | Item | Kep. | Jawapan | Disahkan oleh | Fail terlibat |
|---|---|---|---|---|---|
| 7 | Waktu pejabat sekolah (hari dan jam) | A | | | `pages/hubungi.html`, `data/chatbot-kontekst.json` |
| 8 | Waktu sesi persekolahan tepat (kini "sekitar 12.30 – 5.30") | A | | | `data/sekolah.json` |
| 9 | Saluran rasmi pertanyaan: WhatsApp, e-mel, Facebook, Telegram | B | | | `data/site.json`, `data/chatbot.json` |
| 10 | Nama pengurus media sosial / Admin yang dibenarkan | C | | | dalaman |

## 3. Pendaftaran dan yuran (soalan paling kerap daripada ibu bapa)

| # | Item | Kep. | Jawapan | Disahkan oleh | Fail terlibat |
|---|---|---|---|---|---|
| 11 | Syarat kemasukan (umur, dokumen) | A | | | halaman baharu / `data/chatbot-kontekst.json` |
| 12 | Tempoh pendaftaran sesi 2027 | A | | | sama |
| 13 | Yuran dan bayaran lain (ada/tiada, jumlah) | A | | | sama |
| 14 | Kekosongan kelas / kaedah permohonan | B | | | sama |

## 4. Kurikulum dan pentaksiran

| # | Item | Kep. | Jawapan | Disahkan oleh | Fail terlibat |
|---|---|---|---|---|---|
| 15 | Status aliran **Tahfiz** (wujud/tidak, struktur, syarat) | A | | | `data/kurikulum.json`, `pages/kurikulum.html` |
| 16 | Jadual waktu kelas mengikut tahun (tahap sahaja, tiada nama murid) | B | | | `pages/kurikulum.html` |
| 17 | Takwim sesi 2027 (tarikh peperiksaan, cuti, hari penting) | A | | | `data/aktiviti.json` |
| 18 | Keputusan UPKK **agregat** (peratus lulus/cemerlang mengikut tahun, tanpa nama) | B | | | `pages/pencapaian.html` |
| 19 | Pencapaian sekolah (pertandingan, anugerah) dengan tarikh dan penganjur | B | | | `pages/pencapaian.html` |

## 5. Kokurikulum dan prasarana

| # | Item | Kep. | Jawapan | Disahkan oleh | Fail terlibat |
|---|---|---|---|---|---|
| 20 | Senarai unit kokurikulum rasmi (nama unit sahaja) | B | | | `pages/kokurikulum.html` |
| 21 | Senarai kemudahan (bilik darjah, surau, perpustakaan, tandas, parkir) dan bilangannya | B | | | `pages/prasarana.html` |
| 22 | Kemudahan OKU (ada/tiada) | C | | | `pages/prasarana.html` |

## 5A. Bahan media

| # | Item | Kep. | Jawapan | Disahkan oleh | Fail terlibat |
|---|---|---|---|---|---|
| 23 | Foto bangunan dan persekitaran (tiada wajah murid dikenali tanpa kebenaran ibu bapa) | B | | | `assets/img/` |
| 24 | Foto majlis dengan kebenaran penyiaran | B | | | `data/aktiviti.json` |
| 25 | Logo resolusi tinggi / fail vektor berlatar telus | B | | | `assets/img/` |
| 26 | Buku / bahan bacaan awam yang boleh diterbitkan (PDF, status hak cipta) | C | | | `data/books.json` |
| 27 | Berita dan pengumuman pertama untuk diterbitkan | C | | | `data/berita.json` |

## 6. Soalan lazim ibu bapa (untuk chatbot dan halaman FAQ)

Sila jawab ringkas, 1–3 ayat setiap satu:

1. Apakah yang perlu dibawa murid ke sekolah?
2. Bagaimana memohon cuti atau memaklumkan ketidakhadiran?
3. Adakah pakaian seragam diwajibkan? Apakah spesifikasinya?
4. Bagaimana ibu bapa boleh berjumpa guru?
5. Bagaimana pengumuman dan keputusan dimaklumkan kepada ibu bapa?
6. Adakah murid boleh mendaftar pertengahan sesi?
7. Siapa dihubungi untuk kecemasan?

## 7. Kelulusan penerbitan

| Perkara | Jawapan |
|---|---|
| Pihak sekolah meluluskan laman diterbitkan sebagai laman awam? | Ya / Tidak |
| Pengesahan boleh membuang `noindex` dan banner draf? | Ya / Tidak |
| Nama pegawai yang meluluskan, jawatan, tarikh | |

---

Selepas jawapan diterima, pentadbir laman mengemas kini fail data berkaitan dan
menjalankan:

```bash
node tools/bina-konteks.mjs
python tools/check-site.py
```

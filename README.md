# Laman KAFAI As-Syariff
HTML/CSS/JS vanila, tanpa build. Header & footer dimuat dari `partials/` oleh `assets/js/include.js`.
- Ubah menu: `partials/header.html` (sekali, semua halaman berubah).
- Halaman baharu: salin mana-mana fail dalam `pages/`, tukar `data-page`, tambah pautan menu.
- Buang banner draf: padam baris `.draf-bar` dalam header & `noindex` dalam setiap halaman.
- Sistem guru (kod sedia ada) letak dalam folder `sistem/`.
- Uji tempatan: `python3 -m http.server` (fetch tidak jalan pada `file://`).

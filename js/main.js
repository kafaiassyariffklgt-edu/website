/**
 * main.js — titik masuk laman draf KAFAI As-Syariff Telok Datok.
 *
 * Header, footer, waktu solat dan carian dipasang pada semua halaman.
 * Modul lain hanya dimulakan apabila elemen sasarannya wujud.
 *
 * Setiap modul dijalankan melalui jalankan(): jika satu modul gagal, ralat
 * dicatat dalam konsol dan modul seterusnya tetap dimulakan.
 */

import { mountHeaderFooter } from './modules/components.js';
import { initNav } from './modules/nav.js';
import { initKepimpinan } from './modules/kepimpinan.js';
import { initBerita } from './modules/berita.js';
import { initAktiviti, initProgramSeterusnya } from './modules/aktiviti.js';
import { initLibrary } from './modules/library/library.js';
import { initSearch } from './modules/search.js';
import { initForms } from './modules/forms.js';
import { initMapButtons } from './modules/mapbtn.js';
import { initTicker } from './modules/ticker.js';
import { initSorotan } from './modules/sorotan.js';
import { initMasaSolatUI } from './modules/masa-solat-ui.js';
import { initSesiSekolah } from './modules/sesi-sekolah.js';
import { initTetapan } from './modules/tetapan.js';
import { initChatbot } from './modules/chatbot/index.js';
import { initDataBind } from './modules/data-bind.js';
import { initGaleri } from './modules/galeri.js';

document.documentElement.classList.add('js-ready');

/** Jalankan satu modul; ralatnya tidak menghentikan modul lain. */
async function jalankan(nama, fungsi) {
  try {
    await fungsi();
  } catch (error) {
    console.error(`Modul "${nama}" gagal dimulakan:`, error);
  }
}

/** Jalankan modul hanya jika elemen sasarannya wujud pada halaman. */
function jikaWujud(pemilih, nama, fungsi) {
  return document.querySelector(pemilih) ? jalankan(nama, fungsi) : undefined;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Pilihan paparan disediakan oleh tetapan.js semasa import; init hanya
  // mengikat kawalan halaman Tetapan apabila elemennya wujud.
  await jalankan('tetapan', initTetapan);

  // Isi nombor dan teks daripada data/*.json (HTML menyimpan nilai sandaran).
  await jalankan('data-bind', initDataBind);
  await jikaWujud('[data-galeri]', 'galeri', initGaleri);

  await jalankan('header-footer', mountHeaderFooter);
  await jalankan('nav', initNav);
  await jalankan('masa-solat', initMasaSolatUI);
  await jalankan('sesi-sekolah', initSesiSekolah);
  await jalankan('carian', initSearch);
  await jalankan('borang', initForms);
  await jalankan('butang-peta', initMapButtons);
  await jalankan('ticker', initTicker);
  await jalankan('sorotan', initSorotan);
  await jalankan('chatbot', initChatbot);

  await jikaWujud('#kepimpinan-grid', 'kepimpinan', initKepimpinan);
  await jikaWujud('#berita-list', 'berita', initBerita);
  await jikaWujud('#aktiviti-list', 'aktiviti', initAktiviti);
  await jikaWujud('#program-seterusnya-list', 'program-seterusnya', initProgramSeterusnya);
  await jikaWujud('#bookshelf', 'perpustakaan', initLibrary);
});

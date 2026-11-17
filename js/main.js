/**
 * main.js — titik masuk laman draf KAFAI As-Syariff Telok Datok.
 *
 * Header, footer, waktu solat dan carian dipasang pada semua halaman.
 * Modul lain hanya dimulakan apabila elemen sasarannya wujud.
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
import { initTetapan } from './modules/tetapan.js';
import { initChatbot } from './modules/chatbot/index.js';

document.documentElement.classList.add('js-ready');

document.addEventListener('DOMContentLoaded', async () => {
  // Pilihan paparan disediakan oleh tetapan.js semasa import; init hanya
  // mengikat kawalan halaman Tetapan apabila elemennya wujud.
  initTetapan();

  await mountHeaderFooter();
  initNav();
  initMasaSolatUI();
  initSearch();
  initForms();
  initMapButtons();
  initTicker();
  initSorotan();
  await initChatbot();

  if (document.querySelector('#kepimpinan-grid')) await initKepimpinan();
  if (document.querySelector('#berita-list')) await initBerita();
  if (document.querySelector('#aktiviti-list')) await initAktiviti();
  if (document.querySelector('#program-seterusnya-list')) await initProgramSeterusnya();
  if (document.querySelector('#bookshelf')) await initLibrary();
});

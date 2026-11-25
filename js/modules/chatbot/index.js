/**
 * index.js — widget chatbot "ASY-SYARIFF BOT".
 *
 * Modular:
 *   - api.js    : konfigurasi, endpoint dan aliran SSE
 *   - render.js : pemaparan teks jawapan dengan selamat
 *   - index.js  : antara muka, menu soalan dan keadaan perbualan
 *
 * Menu soalan diambil sepenuhnya daripada data/chatbot.json. Tambah atau buang
 * item dalam array "menu" untuk mengubah senarai tanpa menyentuh kod.
 */
import { siteHref } from '../../paths.js';
import { ChatError, hantarMesej, muatKonfigurasi, tentukanEndpoint } from './api.js';
import { el, renderRichText } from './render.js';

const LOGO = 'assets/img/logo-kafa-64.png';
const MAX_HISTORY = 8;
const MAX_INPUT = 1000;
const TIMEOUT_MS = 90_000;
const ID_DIALOG = 'asyabot-dialog';

let widget;

export async function initChatbot() {
  if (document.getElementById(ID_DIALOG)) return;

  try {
    const konfigurasi = await muatKonfigurasi();
    if (!konfigurasi || konfigurasi.aktif === false) return;

    widget = binaWidget(konfigurasi);
    document.body.append(widget.launcher, widget.dialog);

    const params = new URLSearchParams(location.search);
    if (params.get('chat') === '1') {
      widget.buka();
      const soalanAwal = params.get('tanya');
      if (soalanAwal) window.setTimeout(() => widget.tanya(soalanAwal), 250);
    }

    // API kecil untuk halaman lain membuka chatbot secara programatik.
    window.AsyariffBot = {
      buka: () => widget.buka(),
      tutup: () => widget.tutup(),
      tanya: (soalan) => widget.tanya(soalan),
    };
  } catch (error) {
    // Widget tidak boleh menggagalkan modul lain pada halaman.
    console.error('Chatbot: gagal dipasang.', error);
  }
}

function binaWidget(konfigurasi) {
  // ==============================================================
  // KEMASKINI DI SINI: Kita tetapkan URL Worker secara terus (hardcode)
  // Ini bagi memastikan ia tidak gagal mencari endpoint dari fail konfigurasi.
  // ==============================================================
  const endpoint = "https://asyariff-bot.asyariff-kafa.workers.dev/api/chat"; 
  
  const state = {
    endpoint,
    history: [],
    sibuk: false,
    pengawal: null,
    disambut: false,
    menuTerbuka: true,
  };

  const nama = String(konfigurasi.nama || 'ASY-SYARIFF BOT');
  const whatsapp = String(konfigurasi.whatsapp || '');
  const telegram = String(konfigurasi.telegram || '');
  const menu = Array.isArray(konfigurasi.menu) ? konfigurasi.menu.filter((i) => i?.soalan) : [];

  // ---------- Butang terapung ----------
  const launcher = el('button', 'asyabot-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', ID_DIALOG);
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-label', `Buka ${nama}`);

  const launcherLogo = el('span', 'asyabot-launcher__logo');
  const launcherImg = document.createElement('img');
  launcherImg.src = siteHref(LOGO);
  launcherImg.alt = '';
  launcherImg.width = 34;
  launcherImg.height = 34;
  launcherImg.decoding = 'async';
  launcherLogo.append(launcherImg);

  const launcherText = el('span', 'asyabot-launcher__text');
  launcherText.append(el('strong', '', 'TANYA KAFAI'), el('span', '', 'AS-SYARIFF'));
  launcher.append(launcherLogo, launcherText);

  // ---------- Dialog ----------
  const dialog = document.createElement('dialog');
  dialog.className = 'asyabot';
  dialog.id = ID_DIALOG;
  dialog.setAttribute('aria-labelledby', 'asyabot-title');

  const head = el('header', 'asyabot__head');

  const headLogo = el('span', 'asyabot__logo');
  const headImg = document.createElement('img');
  headImg.src = siteHref(LOGO);
  headImg.alt = '';
  headImg.width = 32;
  headImg.height = 32;
  headImg.decoding = 'async';
  headLogo.append(headImg);

  const ident = el('span', 'asyabot__ident');
  const title = el('span', 'asyabot__title', nama);
  title.id = 'asyabot-title';
  const status = el('span', 'asyabot__status');
  const statusDot = el('span', 'asyabot__status-dot');
  statusDot.setAttribute('aria-hidden', 'true');
  status.append(statusDot, document.createTextNode(endpoint ? 'Pembantu maya AI' : 'Mod AI belum disambung'));
  if (!endpoint) status.classList.add('is-offline');
  ident.append(title, status);

  const menuToggle = el('button', 'asyabot__menu-toggle', 'Menu');
  menuToggle.type = 'button';
  menuToggle.setAttribute('aria-label', konfigurasi.menu_tajuk || 'Menu soalan');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-controls', 'asyabot-menu');

  const closeButton = el('button', 'asyabot__close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Tutup chatbot');

  head.append(headLogo, ident, menuToggle, closeButton);

  // ---------- Log perbualan ----------
  const log = el('div', 'asyabot__log');
  log.id = 'asyabot-log';
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-relevant', 'additions text');

  // ---------- Menu soalan ----------
  const menuSection = el('section', 'asyabot__menu');
  menuSection.id = 'asyabot-menu';
  menuSection.setAttribute('aria-label', konfigurasi.menu_tajuk || 'Menu soalan');
  const menuTitle = el('p', 'asyabot__menu-title', konfigurasi.menu_tajuk || 'Menu soalan');
  const menuList = el('div', 'asyabot__menu-list');
  menuList.setAttribute('role', 'group');

  if (!menu.length) {
    menuSection.hidden = true;
    menuToggle.hidden = true;
  }

  for (const item of menu) {
    const butang = el('button', 'asyabot__menu-item');
    butang.type = 'button';
    butang.dataset.soalan = String(item.soalan);
    butang.append(
      el('span', 'asyabot__menu-label', String(item.label || item.soalan)),
      el('span', 'asyabot__menu-arrow', '→')
    );
    butang.addEventListener('click', () => tanya(item.soalan));
    menuList.append(butang);
  }

  menuSection.append(menuTitle, menuList);

  // ---------- Borang input ----------
  const form = el('form', 'asyabot__form');
  form.setAttribute('novalidate', '');

  const input = document.createElement('textarea');
  input.id = 'asyabot-input';
  input.className = 'asyabot__input';
  input.rows = 1;
  input.maxLength = MAX_INPUT;
  input.autocomplete = 'off';
  input.placeholder = konfigurasi.placeholder || 'Taip soalan anda…';
  input.setAttribute('aria-label', 'Soalan untuk chatbot');

  const sendButton = el('button', 'asyabot__send');
  sendButton.type = 'submit';
  sendButton.setAttribute('aria-label', 'Hantar soalan');
  sendButton.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
    '<path d="M4 12l16-8-5.5 16-3.2-6.3L4 12z" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linejoin="round"/></svg>';

  form.append(input, sendButton);

  // ---------- Nota kaki ----------
  const note = el('p', 'asyabot__note');
  note.append(
    el(
      'span',
      '',
      konfigurasi.nota ||
        'Jawapan dijana oleh AI dan mungkin tidak lengkap. Sahkan maklumat penting dengan pihak sekolah.'
    )
  );

  const pautan = el('span', 'asyabot__note-links');
  if (whatsapp) {
    const a = document.createElement('a');
    a.href = whatsapp;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'WhatsApp';
    pautan.append(a);
  }
  if (telegram) {
    const a = document.createElement('a');
    a.href = telegram;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Telegram';
    pautan.append(a);
  }
  if (pautan.childElementCount) note.append(pautan);

  dialog.append(head, log, menuSection, form, note);

  // ---------- Bantuan ----------
  function skrol(paksa = false) {
    const dekatBawah = log.scrollHeight - log.scrollTop - log.clientHeight < 90;
    if (paksa || dekatBawah) log.scrollTop = log.scrollHeight;
  }

  function tambahMesej(peranan, teks = '') {
    const baris = el('div', `asyabot-msg asyabot-msg--${peranan}`);
    const buih = el('div', 'asyabot-msg__bubble');
    if (teks) renderRichText(buih, teks);
    baris.append(buih);
    log.append(baris);
    skrol(true);
    return buih;
  }

  function tambahMenaip() {
    const buih = tambahMesej('bot');
    const penunjuk = el('span', 'asyabot-typing');
    penunjuk.setAttribute('aria-label', 'Sedang menaip');
    penunjuk.append(el('span'), el('span'), el('span'));
    buih.append(penunjuk);
    return buih;
  }

  function tambahRalat(mesej) {
    const pautanRalat = whatsapp ? `\n\n[Hubungi sekolah melalui WhatsApp](${whatsapp})` : '';
    tambahMesej('bot', `${mesej}${pautanRalat}`);
  }

  function setSibuk(nilai) {
    state.sibuk = nilai;
    dialog.setAttribute('aria-busy', nilai ? 'true' : 'false');
    form.classList.toggle('is-busy', nilai);
    sendButton.disabled = nilai;
    for (const butang of menuList.querySelectorAll('button')) butang.disabled = nilai;
  }

  function autoTinggi() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
  }

  async function tanya(soalan) {
    const teks = String(soalan || '').trim().slice(0, MAX_INPUT);
    if (!teks || state.sibuk) return;

    if (!state.endpoint) {
      tambahMesej(
        'bot',
        `Mod AI belum disambungkan pada laman ini. Untuk pertanyaan rasmi, sila hubungi sekolah${
          whatsapp ? ` melalui [WhatsApp](${whatsapp})` : ''
        } atau e-mel kafaiassyariff.klgt@gmail.com.`
      );
      menuSection.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
      state.menuTerbuka = false;
      return;
    }

    setSibuk(true);
    tambahMesej('user', teks);
    state.history.push({ role: 'user', content: teks });
    if (state.history.length > MAX_HISTORY) state.history = state.history.slice(-MAX_HISTORY);

    const buih = tambahMenaip();
    const pengawal = new AbortController();
    state.pengawal = pengawal;
    const pemasa = setTimeout(() => pengawal.abort('tamat-masa'), TIMEOUT_MS);
    let penuh = '';
    let mula = false;

    try {
      const jawapan = await hantarMesej({
        endpoint: state.endpoint,
        messages: state.history,
        signal: pengawal.signal,
        onDelta: (delta) => {
          if (!mula) {
            mula = true;
            buih.replaceChildren();
          }
          penuh += delta;
          buih.textContent = penuh;
          skrol();
        },
      });

      const akhir = jawapan || penuh;
      if (!akhir.trim()) throw new ChatError('Jawapan AI kosong. Cuba lagi.', { kod: 'KOSONG' });

      renderRichText(buih, akhir);
      state.history.push({ role: 'assistant', content: akhir });
      if (state.history.length > MAX_HISTORY) state.history = state.history.slice(-MAX_HISTORY);
      skrol(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        const baris = buih.closest('.asyabot-msg');
        if (baris) baris.remove();
        if (state.pengawal === pengawal) {
          tambahMesej('bot', 'Permintaan dihentikan. Anda boleh cuba soalan lain.');
        }
      } else if (penuh.trim()) {
        renderRichText(buih, penuh);
        tambahMesej('bot', 'Jawapan terhenti sebelum selesai. Cuba lagi atau hubungi sekolah.');
      } else {
        const baris = buih.closest('.asyabot-msg');
        if (baris) baris.remove();
        tambahRalat(error.message || 'Ralat tidak dijangka. Cuba lagi.');
        console.error('Chatbot:', error);
      }
    } finally {
      clearTimeout(pemasa);
      state.pengawal = null;
      setSibuk(false);
      autoTinggi();
    }
  }

  function buka() {
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    launcher.hidden = true;
    launcher.setAttribute('aria-expanded', 'true');
    document.body.classList.add('asyabot-open');

    if (!state.disambut) {
      state.disambut = true;
      tambahMesej('bot', konfigurasi.salam || 'Assalamualaikum! Ada yang boleh saya bantu?');
    }

    window.setTimeout(() => input.focus(), 40);
  }

  function tutup() {
    state.pengawal?.abort('ditutup');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('asyabot-open');
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  // ---------- Peristiwa ----------
  launcher.addEventListener('click', buka);
  closeButton.addEventListener('click', tutup);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) tutup();
  });

  dialog.addEventListener('close', () => {
    state.pengawal?.abort('ditutup');
    document.body.classList.remove('asyabot-open');
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  });

  menuToggle.addEventListener('click', () => {
    state.menuTerbuka = !state.menuTerbuka;
    menuSection.hidden = !state.menuTerbuka;
    menuToggle.setAttribute('aria-expanded', state.menuTerbuka ? 'true' : 'false');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const teks = input.value;
    input.value = '';
    autoTinggi();
    tanya(teks);
  });

  input.addEventListener('input', autoTinggi);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dialog.open) {
      event.preventDefault();
      tutup();
    }
  });

  // Jangan biarkan papan kekunci maya menutup ruang input pada telefon.
  input.addEventListener('focus', () => window.setTimeout(() => skrol(true), 250));

  return { launcher, dialog, buka, tutup, tanya, state, endpoint };
}
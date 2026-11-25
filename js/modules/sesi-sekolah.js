/**
 * sesi-sekolah.js — segmen kanan bar waktu solat: status sesi persekolahan.
 *
 * Waktu sesi dibaca daripada atribut data-sesi-* yang dijana components.js
 * daripada data/site.json, jadi tiada permintaan rangkaian tambahan.
 * Panel butiran mengikut corak yang sama seperti senarai waktu solat.
 */

import {
  formatMasa12Jam,
  mulakanJamMalaysia,
} from '../../web-api-module/index.js';

const NAMA_HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const SUSUNAN_MINGGU = [1, 2, 3, 4, 5, 6, 0];

function masa12(nilai, sandaran = nilai) {
  try {
    return formatMasa12Jam(nilai);
  } catch {
    return sandaran;
  }
}

function minit(nilai) {
  const [jam, mnt] = String(nilai || '').split(':').map(Number);
  return Number.isFinite(jam) && Number.isFinite(mnt) ? jam * 60 + mnt : null;
}

function tempoh(minitBaki) {
  if (minitBaki <= 0) return 'kurang seminit';
  const jam = Math.floor(minitBaki / 60);
  const mnt = minitBaki % 60;
  if (jam && mnt) return `${jam} jam ${mnt} minit`;
  if (jam) return `${jam} jam`;
  return `${mnt} minit`;
}

function hariDariISO(iso) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

function bacaKonfigurasi(bar) {
  const hari = String(bar.dataset.sesiHari || '1,2,3,4,5')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return {
    mula: bar.dataset.sesiMula || '14:30',
    tamat: bar.dataset.sesiTamat || '17:30',
    hari: hari.length ? hari : [1, 2, 3, 4, 5],
  };
}

function kiraStatus(masa, cfg) {
  const hari = hariDariISO(masa.tarikh);
  const sekarang = minit(masa.masa.slice(0, 5));
  const mula = minit(cfg.mula) ?? 870;
  const tamat = minit(cfg.tamat) ?? 1050;
  const hariIniSesi = cfg.hari.includes(hari);
  const jamMula = masa12(cfg.mula);
  const jamTamat = masa12(cfg.tamat);

  if (hariIniSesi && sekarang >= mula && sekarang < tamat) {
    return {
      negeri: 'buka',
      hari,
      headline: 'Sesi sedang berlangsung',
      ringkas: jamTamat,
      panjang: `Berlangsung · tamat ${jamTamat}`,
      kiraan: `Tamat dalam ${tempoh(tamat - sekarang)}`,
    };
  }

  if (hariIniSesi && sekarang < mula) {
    return {
      negeri: 'sebelum',
      hari,
      headline: 'Sesi belum bermula',
      ringkas: jamMula,
      panjang: `Bermula ${jamMula} · lagi ${tempoh(mula - sekarang)}`,
      kiraan: `Bermula dalam ${tempoh(mula - sekarang)}`,
    };
  }

  let offset = 0;
  let hariSeterusnya = hari;
  for (let i = 1; i <= 7; i += 1) {
    const calon = (hari + i) % 7;
    if (cfg.hari.includes(calon)) {
      offset = i;
      hariSeterusnya = calon;
      break;
    }
  }

  const namaHari = offset === 1 ? 'esok' : NAMA_HARI[hariSeterusnya];
  const bila = `${namaHari} ${jamMula}`;

  return {
    negeri: hariIniSesi ? 'tamat' : 'cuti',
    hari,
    headline: hariIniSesi ? 'Sesi hari ini telah tamat' : 'Hari ini tiada sesi',
    ringkas: offset === 1 ? `Esok ${jamMula}` : `${NAMA_HARI[hariSeterusnya]} ${jamMula}`,
    panjang: `Seterusnya ${bila}`,
    kiraan: `Sesi seterusnya ${bila}`,
  };
}

function binaMinggu(bar, cfg) {
  const senarai = bar.querySelector('[data-session-week]');
  if (!senarai || senarai.childElementCount) return;

  const julat = `${masa12(cfg.mula)} – ${masa12(cfg.tamat)}`;
  for (const hari of SUSUNAN_MINGGU) {
    const buka = cfg.hari.includes(hari);
    const item = document.createElement('li');
    item.className = 'prayerbar__time sessionbar__day';
    item.dataset.sessionHari = String(hari);
    item.dataset.buka = String(buka);

    const nama = document.createElement('span');
    nama.className = 'sessionbar__day-name';
    nama.textContent = NAMA_HARI[hari];

    const waktu = document.createElement('span');
    waktu.className = 'sessionbar__day-time';
    waktu.textContent = buka ? julat : 'Tutup';

    item.append(nama, waktu);
    senarai.append(item);
  }
}

function render(host, bar, status) {
  host.dataset.state = status.negeri;

  const panjang = host.querySelector('[data-session-status]');
  const ringkas = host.querySelector('[data-session-status-short]');
  const headline = bar.querySelector('[data-session-headline]');
  const kiraan = bar.querySelector('[data-session-countdown]');
  const butang = host.querySelector('[data-session-toggle]');

  if (panjang) panjang.textContent = status.panjang;
  if (ringkas) ringkas.textContent = status.ringkas;
  if (headline) headline.textContent = status.headline;
  if (kiraan) kiraan.textContent = status.kiraan;

  for (const item of bar.querySelectorAll('[data-session-hari]')) {
    item.classList.toggle('is-today', Number(item.dataset.sessionHari) === status.hari);
    if (Number(item.dataset.sessionHari) === status.hari) {
      item.setAttribute('aria-current', 'date');
    } else {
      item.removeAttribute('aria-current');
    }
  }

  if (butang) {
    butang.setAttribute(
      'aria-label',
      `Sesi persekolahan: ${status.headline.toLowerCase()}. ${status.panjang}. Tekan untuk jadual mingguan.`
    );
  }
}

function tutupSolat(bar) {
  bar.classList.remove('is-open');
  const butang = bar.querySelector('[data-prayer-toggle]');
  const butiran = bar.querySelector('[data-prayer-details]');
  const label = bar.querySelector('[data-prayer-toggle-label]');
  if (butang) {
    butang.setAttribute('aria-expanded', 'false');
    butang.setAttribute(
      'aria-label',
      `Buka senarai waktu solat. ${bar.dataset.nextAria || ''}`.trim()
    );
  }
  if (butiran) butiran.hidden = true;
  if (label) label.textContent = 'Lihat semua';
}

function setTerbuka(bar, host, terbuka) {
  const butang = host.querySelector('[data-session-toggle]');
  const butiran = bar.querySelector('[data-session-details]');
  if (!butang || !butiran) return;
  butang.setAttribute('aria-expanded', String(terbuka));
  butiran.hidden = !terbuka;
  host.classList.toggle('is-open', terbuka);
}

export function initSesiSekolah() {
  const bar = document.querySelector('[data-prayerbar]');
  const host = bar?.querySelector('[data-sessionbar]');
  if (!bar || !host) return () => {};

  const cfg = bacaKonfigurasi(bar);
  const butang = host.querySelector('[data-session-toggle]');

  binaMinggu(bar, cfg);

  const kemasKini = (masa) => render(host, bar, kiraStatus(masa, cfg));
  const hentikan = mulakanJamMalaysia(kemasKini, { selangMs: 20000 });

  butang?.addEventListener('click', () => {
    const buka = butang.getAttribute('aria-expanded') !== 'true';
    if (buka) tutupSolat(bar);
    setTerbuka(bar, host, buka);
  });

  const bersihkan = () => hentikan();
  window.addEventListener('pagehide', bersihkan, { once: true });
  return bersihkan;
}

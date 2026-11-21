#!/usr/bin/env node
/**
 * bina-statik.mjs — jana senarai program statik dalam HTML daripada data/aktiviti.json.
 *
 * Mengapa: senarai program dahulu hanya wujud selepas JavaScript berjalan, jadi
 * pelayar tanpa JavaScript dan robot enjin carian tidak nampak takwim sekolah.
 * Skrip ini menulis kad program terus ke dalam HTML (progressive enhancement).
 * JavaScript (js/modules/aktiviti.js) kemudian hanya menapis program yang sudah
 * berlalu dan menyerlahkan program terdekat.
 *
 * Bahagian yang dijana (di antara penanda <!-- statik:NAMA:mula --> dan
 * <!-- statik:NAMA:tamat -->):
 *   program-seterusnya  index.html          4 program disahkan terdekat
 *   senarai-program     pages/program.html  semua program (terbaru dahulu)
 *
 * Penggunaan:
 *   node tools/bina-statik.mjs           tulis perubahan ke fail
 *   node tools/bina-statik.mjs --semak   semak sahaja (kod keluar 1 jika lapuk)
 *
 * Jalankan semula setiap kali data/aktiviti.json berubah, dan sebelum terbitan,
 * kerana "program seterusnya" bergantung pada tarikh hari ini.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEMAK_SAHAJA = process.argv.includes('--semak');

const BULAN = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];

function esc(nilai = '') {
  return String(nilai).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function tarikhHariIni() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' });
}

function formatTarikh(iso) {
  const [t, b, h] = String(iso).split('-').map(Number);
  return `${h} ${BULAN[b - 1]} ${t}`;
}

/** Imej tempatan sahaja; awalan laluan mengikut lokasi halaman. */
function imejTempatan(src, awalan) {
  const laluan = String(src || '').replaceAll('\\', '/');
  if (!laluan || laluan.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(laluan)) return '';
  if (laluan.split('/').includes('..')) return '';
  return `${awalan}${laluan}`;
}

function kadProgram(item, { awalan, pautanProgram, terdekat }) {
  const slug = item.slug || item.id || '';
  const url = `${pautanProgram}?slug=${encodeURIComponent(slug)}`;
  const disahkan = item.status === 'disahkan';
  const gambar = Array.isArray(item.gambar)
    ? item.gambar.find((g) => g && typeof g.src === 'string' && typeof g.alt === 'string')
    : null;
  const src = gambar ? imejTempatan(gambar.src, awalan) : '';

  const media = src
    ? `
    <div class="card__media activity-card__media">
      <img src="${esc(src)}" alt="${esc(gambar.alt)}" loading="lazy" decoding="async">
    </div>`
    : '';

  const tarikh = item.tarikh
    ? `<time datetime="${esc(item.tarikh)}">${esc(formatTarikh(item.tarikh))}</time>`
    : '<span>Tarikh belum disahkan</span>';

  return `<article class="card activity-card${terdekat ? ' is-nearest' : ''}" data-tarikh="${esc(item.tarikh || '')}">${media}
    <div class="card__body">
      <div class="activity-card__meta">
        ${tarikh}
        ${item.kategori ? `<span class="card__tag">${esc(item.kategori)}</span>` : ''}
        <span class="status-pill status-pill--${disahkan ? 'disahkan' : 'draf'}">${disahkan ? 'Disahkan' : 'Cadangan'}</span>
      </div>
      <h3 class="activity-card__title"><a href="${esc(url)}">${esc(item.tajuk || '')}</a></h3>
      <p class="activity-card__summary">${esc(item.ringkas || '')}</p>${
        item.lokasi ? `\n      <p class="activity-card__place">Lokasi: ${esc(item.lokasi)}</p>` : ''
      }
      <div class="activity-card__actions">
        <a class="card__link" href="${esc(url)}">Lihat butiran</a>
      </div>
    </div>
  </article>`;
}

function janaSeterusnya(items, hariIni) {
  const akan = items
    .filter((i) => i.status === 'disahkan' && !i.sorotan && i.tarikh && i.tarikh >= hariIni)
    .sort((a, b) => a.tarikh.localeCompare(b.tarikh))
    .slice(0, 4);
  const pilihan = { awalan: '', pautanProgram: 'pages/program.html' };
  if (!akan.length) {
    return '<p class="empty">Tiada program akan datang dalam data awam buat masa ini. ' +
      'Sila semak halaman <a href="pages/program.html">Program</a> untuk kalendar penuh.</p>';
  }
  return akan.map((item, n) => kadProgram(item, { ...pilihan, terdekat: n === 0 })).join('\n          ');
}

function janaSenarai(items, hariIni) {
  const susunan = [...items].sort((a, b) => String(b.tarikh || '').localeCompare(String(a.tarikh || '')));
  const terdekat = items
    .filter((i) => i.status === 'disahkan' && !i.sorotan && i.tarikh && i.tarikh >= hariIni)
    .sort((a, b) => a.tarikh.localeCompare(b.tarikh))[0];
  const pilihan = { awalan: '../', pautanProgram: 'program.html' };
  return susunan
    .map((item) => kadProgram(item, { ...pilihan, terdekat: terdekat && item.id === terdekat.id }))
    .join('\n          ');
}

function gantiBahagian(html, nama, kandungan) {
  const corak = new RegExp(
    `(<!-- statik:${nama}:mula -->)[\\s\\S]*?(<!-- statik:${nama}:tamat -->)`
  );
  if (!corak.test(html)) throw new Error(`Penanda "statik:${nama}" tidak dijumpai.`);
  return html.replace(corak, (_, mula, tamat) => `${mula}\n          ${kandungan}\n          ${tamat}`);
}

async function proses(fail, bahagian, jana, items, hariIni) {
  const laluan = path.join(AKAR, fail);
  const asal = await readFile(laluan, 'utf8');
  const baru = gantiBahagian(asal, bahagian, jana(items, hariIni));
  return { fail, laluan, asal, baru, berubah: asal !== baru };
}

async function utama() {
  const data = JSON.parse(await readFile(path.join(AKAR, 'data', 'aktiviti.json'), 'utf8'));
  const items = data.filter((i) => i && i.status !== 'ditarik');
  const hariIni = tarikhHariIni();

  const hasil = await Promise.all([
    proses('index.html', 'program-seterusnya', janaSeterusnya, items, hariIni),
    proses('pages/program.html', 'senarai-program', janaSenarai, items, hariIni),
  ]);

  const lapuk = hasil.filter((h) => h.berubah).map((h) => h.fail);
  if (!lapuk.length) {
    console.log(`Senarai statik sudah terkini (${hariIni}). Tiada perubahan.`);
    return;
  }
  if (SEMAK_SAHAJA) {
    console.error(`LAPUK: ${lapuk.join(', ')}. Jalankan "node tools/bina-statik.mjs".`);
    process.exitCode = 1;
    return;
  }
  await Promise.all(hasil.filter((h) => h.berubah).map((h) => writeFile(h.laluan, h.baru, 'utf8')));
  console.log(`Dikemas kini: ${lapuk.join(', ')} (tarikh rujukan ${hariIni}).`);
}

utama().catch((ralat) => {
  console.error('Gagal:', ralat.message);
  process.exitCode = 1;
});

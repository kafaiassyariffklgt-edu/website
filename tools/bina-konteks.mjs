#!/usr/bin/env node
/**
 * bina-konteks.mjs — kemas kini fakta automatik dalam data/chatbot-kontekst.json
 * daripada data/sekolah.json dan data/statistik.json.
 *
 * Mengapa: nombor dan alamat dahulu ditaip dua kali (laman dan konteks bot) dan
 * mudah tidak selaras. Kini fakta bertanda id di bawah dijana semula daripada
 * sumber data yang sama dengan laman. Fakta lain kekal disunting dengan tangan.
 *
 * Fakta yang dijana (ikut medan "id" dalam chatbot-kontekst.json):
 *   identiti   <- sekolah.json
 *   hubungan   <- sekolah.json
 *   statistik  <- statistik.json
 *
 * Penggunaan:
 *   node tools/bina-konteks.mjs           tulis perubahan ke fail
 *   node tools/bina-konteks.mjs --semak   hanya semak; keluar dengan kod 1 jika
 *                                         konteks tidak selaras (sesuai untuk CI)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAIL = {
  sekolah: path.join(AKAR, 'data', 'sekolah.json'),
  statistik: path.join(AKAR, 'data', 'statistik.json'),
  konteks: path.join(AKAR, 'data', 'chatbot-kontekst.json'),
};

const SEMAK_SAHAJA = process.argv.includes('--semak');

const KATA_BILANGAN = { 1: 'satu', 2: 'dua', 3: 'tiga', 4: 'empat', 5: 'lima' };

async function bacaJson(laluan) {
  return JSON.parse(await readFile(laluan, 'utf8'));
}

function ringkasBeza(murid) {
  const beza = Math.abs(murid.jumlah - murid.catatanHarian);
  if (beza === 0) return ` dan sepadan dengan enrolmen`;
  const kata = KATA_BILANGAN[beza] || String(beza);
  return ` dan perbezaan ${kata} murid belum diselesaikan`;
}

/** Setiap fungsi memulangkan teks fakta berdasarkan data semasa. */
const PENJANA = {
  identiti: ({ sekolah: s }) => {
    const cawangan = `${s.lokasi.replace(/,\s*Selangor$/i, '')}, ${s.daerah}`;
    return (
      `Nama rasmi: ${s.namaPaparan} (singkatan ${s.singkatan}). ` +
      `Nama penuh: ${s.namaPenuh}. ` +
      `Motto: '${s.mottoRumi}' (${s.motto}). ` +
      `Cawangan: ${cawangan}. ` +
      `Sesi persekolahan: ${s.sesi.toLowerCase()}. ` +
      `Kod JAKIM: ${s.kod}. ` +
      `Status pendaftaran: ${s.status}. ` +
      `Sekolah ini berada di bawah seliaan JAIS Selangor dan menggunakan kurikulum KAFA JAKIM.`
    );
  },

  hubungan: ({ sekolah: s }) =>
    `Alamat: ${s.alamat}. ` +
    `Telefon pejabat: ${s.telefonPejabat}. ` +
    `Telefon dan WhatsApp pentadbiran: ${s.telefon}. ` +
    `E-mel pentadbiran: ${s.emel}. ` +
    `E-mel JAIS: ${s.emelJais}. ` +
    `Facebook rasmi: ${s.facebookRasmi}. ` +
    `Facebook pentadbiran: ${s.facebook}. ` +
    `Linktree: ${s.linktree}. ` +
    `Lokasi bersebelahan ${s.lokasiBersebelahan}. ` +
    `Peta: ${s.peta}`,

  statistik: ({ statistik: t }) => {
    const m = t.murid;
    const penubuhan = String(t.tahunDitubuhkan).replace(/^sekitar\s+/i, 'sekitar tahun ');
    const asrama = String(t.asrama).toLowerCase() === 'tiada' ? 'Tiada asrama.' : `Asrama: ${t.asrama}.`;
    return (
      `${t.kelas} kelas (Tahun 1 hingga Tahun ${t.kelas}), ` +
      `${m.jumlah} murid berdaftar (${m.lelaki} lelaki dan ${m.perempuan} perempuan; ` +
      `papan catatan harian mencatat ${m.catatanHarian}${ringkasBeza(m)}), ` +
      `${t.guru} guru, ${t.mataPelajaran} mata pelajaran dan ${t.program} program dalam kalendar. ` +
      `Bangunan sendiri sejak ${t.bangunanSendiri}. ` +
      `Tarikh penubuhan ${penubuhan} masih memerlukan pengesahan. ` +
      asrama
    );
  },
};

function tarikhHariIni() {
  // Format YYYY-MM-DD mengikut waktu Malaysia.
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' });
}

async function utama() {
  const [sekolah, statistik, konteks] = await Promise.all([
    bacaJson(FAIL.sekolah),
    bacaJson(FAIL.statistik),
    bacaJson(FAIL.konteks),
  ]);
  const sumber = { sekolah, statistik };

  const fakta = Array.isArray(konteks.fakta) ? konteks.fakta : [];
  const berubah = [];
  const hilang = [];

  for (const [id, jana] of Object.entries(PENJANA)) {
    const item = fakta.find((f) => f?.id === id);
    if (!item) {
      hilang.push(id);
      continue;
    }
    const baru = jana(sumber);
    if (item.teks !== baru) {
      berubah.push(id);
      item.teks = baru;
    }
  }

  if (hilang.length) {
    console.error(`RALAT: fakta dengan id berikut tiada dalam chatbot-kontekst.json: ${hilang.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  if (!berubah.length) {
    console.log('Konteks bot sudah selaras dengan data laman. Tiada perubahan.');
    return;
  }

  if (SEMAK_SAHAJA) {
    console.error(`TIDAK SELARAS: ${berubah.join(', ')}. Jalankan "node tools/bina-konteks.mjs".`);
    process.exitCode = 1;
    return;
  }

  konteks.dikemaskini = tarikhHariIni();
  await writeFile(FAIL.konteks, `${JSON.stringify(konteks, null, 2)}\n`, 'utf8');
  console.log(`Dikemas kini: ${berubah.join(', ')} (dikemaskini ${konteks.dikemaskini}).`);
}

utama().catch((ralat) => {
  console.error('Gagal:', ralat.message);
  process.exitCode = 1;
});

/**
 * data-bind.js — isi nilai halaman daripada data/*.json.
 *
 * Satu sumber kebenaran: ubah nombor atau teks sekali dalam fail JSON dan
 * semua halaman mengikutinya.
 *
 * Penggunaan dalam HTML:
 *   <strong data-bind="statistik.murid.jumlah">181</strong>
 *
 * - Segmen pertama ialah nama sumber: "statistik" atau "sekolah".
 * - Baki laluan ialah kunci bersarang dalam fail itu (dipisah titik).
 * - Teks di dalam elemen ialah NILAI SANDARAN. Ia kekal jika JavaScript mati,
 *   fail JSON gagal dimuat atau laluan tidak wujud, jadi laman tidak pernah kosong.
 * - Nilai dimasukkan sebagai teks (textContent), tidak pernah sebagai HTML.
 */
import { PATHS, siteUrl } from '../paths.js';

const SUMBER = {
  statistik: PATHS.data.statistik,
  sekolah: PATHS.data.sekolah,
};

async function muat(laluan) {
  const respons = await fetch(siteUrl(laluan), { cache: 'no-cache' });
  if (!respons.ok) throw new Error(`${laluan} ${respons.status}`);
  return respons.json();
}

/** Ikut laluan bersarang, contoh ['murid', 'jumlah']. */
function ambil(objek, kunci) {
  let nilai = objek;
  for (const k of kunci) {
    if (nilai === null || typeof nilai !== 'object' || !(k in nilai)) return undefined;
    nilai = nilai[k];
  }
  return nilai;
}

export async function initDataBind() {
  const nod = Array.from(document.querySelectorAll('[data-bind]'));
  if (!nod.length) return;

  // Muat hanya sumber yang benar-benar diperlukan oleh halaman ini.
  const diperlukan = new Set(
    nod.map((el) => (el.dataset.bind || '').split('.')[0]).filter((nama) => SUMBER[nama])
  );

  const data = {};
  await Promise.all(
    Array.from(diperlukan).map(async (nama) => {
      try {
        data[nama] = await muat(SUMBER[nama]);
      } catch (error) {
        console.warn(`data-bind: gagal memuatkan "${nama}", nilai sandaran HTML digunakan.`, error);
      }
    })
  );

  for (const el of nod) {
    const [nama, ...kunci] = (el.dataset.bind || '').split('.');
    if (!data[nama] || !kunci.length) continue;

    const nilai = ambil(data[nama], kunci);
    if (nilai === undefined || nilai === null || typeof nilai === 'object') {
      console.warn(`data-bind: laluan "${el.dataset.bind}" tidak dijumpai.`);
      continue;
    }
    el.textContent = String(nilai);
  }
}

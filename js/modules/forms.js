/**
 * forms.js — borang pertanyaan waris melalui WhatsApp.
 *
 * Laman ini dihos secara statik (GitHub Pages) dan tiada pelayan backend.
 * Borang menyusun mesej berstruktur, kemudian membuka WhatsApp dengan mesej itu
 * sudah diisi (wa.me) kepada pentadbiran sekolah. Waris perlu menekan hantar
 * dalam WhatsApp. Tiada data disimpan atau dihantar ke mana-mana pelayan oleh laman ini.
 *
 * Jika WhatsApp tidak dapat dibuka (contohnya tiada aplikasi), pautan e-mel
 * dengan kandungan yang sama dipaparkan sebagai pilihan lain.
 *
 * Untuk menukar kepada Formspree atau Web3Forms pada masa depan, gantikan
 * langkah "bukaWhatsApp" dengan fetch() POST ke endpoint pilihan.
 */

const NOMBOR_WHATSAPP = '60136656964';
const EMEL_PENTADBIRAN = 'kafaiassyariff.klgt@gmail.com';
const SEKOLAH = 'KAFA Integrasi As-Syariff Telok Datok (BYT1005)';

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );

function nilai(form, nama) {
  const medan = form.elements[nama];
  return medan && typeof medan.value === 'string' ? medan.value.trim() : '';
}

/** Mesej berstruktur; baris kosong diabaikan. */
export function binaMesej(form) {
  const baris = [
    `Assalamualaikum, saya ingin membuat pertanyaan kepada ${SEKOLAH}.`,
    '',
    `*Nama waris:* ${nilai(form, 'nama')}`,
    `*Hubungan dengan murid:* ${nilai(form, 'hubungan')}`,
  ];

  const telefon = nilai(form, 'telefon');
  if (telefon) baris.push(`*No. telefon:* ${telefon}`);

  baris.push(`*Jenis pertanyaan:* ${nilai(form, 'jenis')}`);

  const tahun = nilai(form, 'tahun');
  if (tahun) baris.push(`*Tahun murid:* ${tahun}`);

  baris.push('', '*Mesej:*', nilai(form, 'mesej'), '', 'Dihantar melalui laman web rasmi sekolah.');
  return baris.join('\n');
}

const urlWhatsApp = (teks) => `https://wa.me/${NOMBOR_WHATSAPP}?text=${encodeURIComponent(teks)}`;

const urlEmel = (teks, jenis) =>
  `mailto:${EMEL_PENTADBIRAN}?subject=${encodeURIComponent(
    `Pertanyaan waris: ${jenis || 'Umum'}`
  )}&body=${encodeURIComponent(teks)}`;

export function initForms() {
  const form = document.querySelector('[data-form-waris]');
  if (!form) return;

  const status = form.querySelector('.form__status');

  const papar = (html, ralat = false) => {
    if (!status) return;
    status.innerHTML = html;
    status.classList.add('is-visible');
    status.classList.toggle('form__status--ok', !ralat);
    status.classList.toggle('form__status--error', ralat);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      papar('Sila lengkapkan medan bertanda * dan tandakan persetujuan sebelum menghantar.', true);
      return;
    }

    const mesej = binaMesej(form);
    const wa = urlWhatsApp(mesej);
    const emel = urlEmel(mesej, nilai(form, 'jenis'));
    const nama = nilai(form, 'nama') || 'saudara';

    // Dibuka serta-merta dalam gerak balas klik supaya tidak disekat oleh pelayar.
    // (Pilihan "noopener" dielakkan kerana ia menyebabkan window.open sentiasa
    // memulangkan null, jadi sekatan pop-up tidak dapat dikesan.)
    const tetingkap = window.open(wa, '_blank');
    if (tetingkap) tetingkap.opener = null;

    papar(
      `<strong>Terima kasih, ${esc(nama)}.</strong> ` +
        (tetingkap
          ? 'WhatsApp dibuka dengan mesej anda. Sila tekan <em>hantar</em> dalam WhatsApp untuk melengkapkannya. '
          : 'Pelayar menyekat tetingkap baharu. ') +
        `Jika WhatsApp tidak terbuka, <a href="${esc(wa)}" target="_blank" rel="noopener noreferrer">` +
        `buka WhatsApp di sini</a> atau <a href="${esc(emel)}">hantar melalui e-mel</a>. ` +
        'Anda juga boleh menelefon pejabat di <a href="tel:+60331878498">03-3187 8498</a>.'
    );

    status?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/**
 * galeri.js — karusel gambar sekolah di halaman utama.
 *
 * Tanpa JavaScript, trek gambar ialah bekas gelongsor mendatar (CSS scroll-snap).
 * JavaScript menambah butang, titik navigasi, butang jeda dan putaran automatik.
 * Putaran automatik mati jika pengguna memilih "kurangkan gerakan", berhenti
 * apabila tetikus/fokus berada di galeri, tab disembunyikan atau galeri di luar skrin.
 */

const SELANG_MS = 6000;

export function initGaleri() {
  const akar = document.querySelector('[data-galeri]');
  if (!akar) return;

  const trek = akar.querySelector('[data-galeri-track]');
  const slaid = trek ? Array.from(trek.children) : [];
  if (!trek || slaid.length < 2) return;

  const btnSebelum = akar.querySelector('[data-galeri-prev]');
  const btnSeterusnya = akar.querySelector('[data-galeri-next]');
  const btnMain = akar.querySelector('[data-galeri-play]');
  const hosTitik = akar.querySelector('[data-galeri-dots]');
  const status = akar.querySelector('[data-galeri-status]');
  const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)');

  let indeks = 0;
  let pemasa = null;
  let dijedaPengguna = kurangGerak.matches;
  let tertahan = false;
  let kelihatan = true;
  let rafMenunggu = false;

  akar.classList.add('is-enhanced');

  const titik = slaid.map((_, n) => {
    const butang = document.createElement('button');
    butang.type = 'button';
    butang.className = 'galeri__dot';
    butang.setAttribute('aria-label', `Gambar ${n + 1} daripada ${slaid.length}`);
    butang.addEventListener('click', () => {
      jedaOlehPengguna();
      pergiKe(n);
    });
    hosTitik?.appendChild(butang);
    return butang;
  });

  slaid.forEach((el, n) => {
    el.setAttribute('role', 'group');
    el.setAttribute('aria-roledescription', 'slaid');
    el.setAttribute('aria-label', `${n + 1} daripada ${slaid.length}`);
  });

  function kemasKini(umumkan = false) {
    titik.forEach((butang, n) => {
      if (n === indeks) butang.setAttribute('aria-current', 'true');
      else butang.removeAttribute('aria-current');
    });
    if (umumkan && status) {
      status.textContent = `Gambar ${indeks + 1} daripada ${slaid.length}`;
    }
  }

  function pergiKe(n, { umumkan = true } = {}) {
    indeks = (n + slaid.length) % slaid.length;
    trek.scrollTo({
      left: indeks * trek.clientWidth,
      behavior: kurangGerak.matches ? 'auto' : 'smooth',
    });
    kemasKini(umumkan);
  }

  trek.addEventListener(
    'scroll',
    () => {
      if (rafMenunggu) return;
      rafMenunggu = true;
      requestAnimationFrame(() => {
        rafMenunggu = false;
        const baru = Math.round(trek.scrollLeft / Math.max(trek.clientWidth, 1));
        if (baru !== indeks && baru >= 0 && baru < slaid.length) {
          indeks = baru;
          kemasKini(false);
        }
      });
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    trek.scrollTo({ left: indeks * trek.clientWidth, behavior: 'auto' });
  });

  function berhenti() {
    if (pemasa) {
      clearInterval(pemasa);
      pemasa = null;
    }
  }

  function mula() {
    berhenti();
    if (dijedaPengguna || tertahan || !kelihatan || document.hidden || kurangGerak.matches) return;
    pemasa = setInterval(() => pergiKe(indeks + 1, { umumkan: false }), SELANG_MS);
  }

  function kemasKiniButangMain() {
    if (!btnMain) return;
    btnMain.setAttribute('aria-pressed', String(dijedaPengguna));
    btnMain.textContent = dijedaPengguna ? 'Main' : 'Jeda';
    btnMain.setAttribute(
      'aria-label',
      dijedaPengguna ? 'Mulakan putaran gambar automatik' : 'Jeda putaran gambar automatik'
    );
    status?.setAttribute('aria-live', dijedaPengguna ? 'polite' : 'off');
  }

  function jedaOlehPengguna() {
    if (!dijedaPengguna) {
      dijedaPengguna = true;
      kemasKiniButangMain();
      berhenti();
    }
  }

  btnSebelum?.addEventListener('click', () => {
    jedaOlehPengguna();
    pergiKe(indeks - 1);
  });
  btnSeterusnya?.addEventListener('click', () => {
    jedaOlehPengguna();
    pergiKe(indeks + 1);
  });
  btnMain?.addEventListener('click', () => {
    dijedaPengguna = !dijedaPengguna;
    kemasKiniButangMain();
    mula();
  });

  akar.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      jedaOlehPengguna();
      pergiKe(indeks - 1);
    } else if (event.key === 'ArrowRight') {
      jedaOlehPengguna();
      pergiKe(indeks + 1);
    }
  });

  akar.addEventListener('pointerenter', () => { tertahan = true; berhenti(); });
  akar.addEventListener('pointerleave', () => { tertahan = false; mula(); });
  akar.addEventListener('focusin', () => { tertahan = true; berhenti(); });
  akar.addEventListener('focusout', () => { tertahan = false; mula(); });
  document.addEventListener('visibilitychange', mula);
  kurangGerak.addEventListener?.('change', () => {
    if (kurangGerak.matches) dijedaPengguna = true;
    kemasKiniButangMain();
    mula();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entri) => {
        kelihatan = entri.some((e) => e.isIntersecting);
        mula();
      },
      { threshold: 0.35 }
    ).observe(akar);
  }

  kemasKini(false);
  kemasKiniButangMain();
  mula();
}

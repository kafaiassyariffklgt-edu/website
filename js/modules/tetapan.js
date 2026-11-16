/**
 * tetapan.js — pilihan paparan untuk pelawat.
 *
 * Pilihan (saiz teks dan gerakan) disimpan dalam localStorage pelayar sahaja.
 * Tiada data dihantar ke pelayan dan tiada maklumat peribadi dikumpul.
 *
 * Kelas yang digunakan:
 *   html.teks-besar / html.teks-besaran  — lihat css/pilihan.css
 *   html.reduce-motion                  — lihat css/motion.css
 */

const STORAGE_KEY = 'kafai:pilihan:v1';

const DEFAULT_STATE = Object.freeze({
  teks: 'biasa',
  kurangkanGerakan: false,
});

const TEXT_CLASSES = ['teks-besar', 'teks-besaran'];
const TEXT_LABELS = {
  biasa: 'Biasa',
  besar: 'Besar',
  besaran: 'Besaran',
};

let state = { ...DEFAULT_STATE };
let storage = null;
let el = {};

function getStorage() {
  if (storage) return storage;
  try {
    const candidate = globalThis.localStorage;
    const probe = `${STORAGE_KEY}:probe`;
    candidate.setItem(probe, '1');
    candidate.removeItem(probe);
    storage = candidate;
  } catch {
    storage = null;
  }
  return storage;
}

function normalize(raw) {
  const value = raw && typeof raw === 'object' ? raw : {};
  return {
    teks: Object.hasOwn(TEXT_LABELS, value.teks) ? value.teks : DEFAULT_STATE.teks,
    kurangkanGerakan:
      typeof value.kurangkanGerakan === 'boolean'
        ? value.kurangkanGerakan
        : DEFAULT_STATE.kurangkanGerakan,
  };
}

function load() {
  const store = getStorage();
  if (!store) return { ...DEFAULT_STATE };
  try {
    return normalize(JSON.parse(store.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function save() {
  const store = getStorage();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function apply() {
  const root = document.documentElement;
  root.classList.toggle('teks-besar', state.teks === 'besar');
  root.classList.toggle('teks-besaran', state.teks === 'besaran');
  root.classList.toggle('reduce-motion', state.kurangkanGerakan);
}

function announcement(message) {
  if (!el.status) return;
  el.status.textContent = message;
}

function paint() {
  el.teksButtons?.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.teks === state.teks));
  });

  if (el.gerakanButton) {
    el.gerakanButton.setAttribute('aria-pressed', String(state.kurangkanGerakan));
  }
  if (el.gerakanLabel) {
    el.gerakanLabel.textContent = state.kurangkanGerakan ? 'Aktif' : 'Mati';
  }

  if (el.semasaTeks) el.semasaTeks.textContent = TEXT_LABELS[state.teks];
  if (el.semasaGerakan) {
    el.semasaGerakan.textContent = state.kurangkanGerakan ? 'Dikurangkan' : 'Biasa';
  }

  el.teksButtons?.forEach((button) => {
    button.title = `Saiz teks ${TEXT_LABELS[button.dataset.teks] || ''}`;
  });
}

function setState(patch, message) {
  state = { ...state, ...patch };
  apply();
  const stored = save();
  paint();
  announcement(
    stored
      ? message
      : `${message} Pilihan ini hanya kekal untuk sesi semasa kerana storan pelayar tidak tersedia.`
  );
}

export function initTetapan() {
  const controls = document.querySelector('[data-tetapan]');
  if (!controls) return;

  el = {
    status: controls.querySelector('[data-tetapan-status]'),
    teksButtons: [...controls.querySelectorAll('[data-teks]')],
    gerakanButton: controls.querySelector('[data-gerakan]'),
    gerakanLabel: controls.querySelector('[data-gerakan-label]'),
    semasaTeks: controls.querySelector('[data-semasa-teks]'),
    semasaGerakan: controls.querySelector('[data-semasa-gerakan]'),
    reset: controls.querySelector('[data-tetapan-reset]'),
  };

  el.teksButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const teks = button.dataset.teks;
      if (!Object.hasOwn(TEXT_LABELS, teks)) return;
      setState({ teks }, `Saiz teks ditukar kepada ${TEXT_LABELS[teks]}.`);
    });
  });

  el.gerakanButton?.addEventListener('click', () => {
    const next = !state.kurangkanGerakan;
    setState(
      { kurangkanGerakan: next },
      next ? 'Gerakan dikurangkan.' : 'Gerakan biasa dipulihkan.'
    );
  });

  el.reset?.addEventListener('click', () => {
    state = { ...DEFAULT_STATE };
    const store = getStorage();
    try {
      store?.removeItem(STORAGE_KEY);
    } catch {
      // Abaikan storan yang disekat.
    }
    apply();
    paint();
    announcement('Pilihan paparan telah ditetapkan semula kepada tetapan asal.');
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    apply();
    paint();
    announcement('Pilihan paparan dikemas kini daripada tab lain.');
  });

  paint();

  if (!getStorage()) {
    announcement(
      'Storan pelayar tidak tersedia. Pilihan akan digunakan untuk halaman ini sahaja.'
    );
  }
}

// Terapkan pilihan sebaik sahaja modul dimuatkan supaya saiz teks dan gerakan
// tidak berkelip semasa halaman dibuka.
state = load();
apply();

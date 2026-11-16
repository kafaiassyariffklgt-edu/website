/**
 * berita.js — indeks berita dan pengumuman sekolah.
 *
 * Hanya tajuk, tarikh, kategori dan pautan disimpan. Teks penuh artikel
 * pihak ketiga tidak disalin; pautan luar membuka sumber asal.
 */

import { siteHref } from '../paths.js';
import { esc, formatDate, getJSON } from './utils.js';

function isExternal(url) {
  return /^https?:\/\//i.test(String(url || ''));
}

export async function initBerita() {
  const list = document.querySelector('#berita-list');
  if (!list) return;

  const filter = document.querySelector('#berita-filter');
  const count = document.querySelector('[data-berita-count]');

  let items;
  try {
    items = await getJSON('/data/berita.json');
  } catch (error) {
    console.error(error);
    list.innerHTML = '<li class="empty">Indeks berita tidak dapat dimuatkan.</li>';
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    if (filter) filter.hidden = true;
    if (count) count.textContent = 'Tiada berita diterbitkan lagi.';
    list.innerHTML =
      '<li class="empty">Belum ada berita atau pengumuman dalam data awam. ' +
      'Maklumat program boleh dilihat di <a href="' +
      esc(siteHref('pages/program.html')) +
      '">halaman Program</a>.</li>';
    return;
  }

  const categories = [
    'Semua',
    ...new Set(items.map((item) => item.kategori).filter(Boolean)),
  ];
  let active = 'Semua';

  const render = () => {
    const shown = items
      .filter((item) => active === 'Semua' || item.kategori === active)
      .sort((a, b) => String(b.tarikh).localeCompare(String(a.tarikh)));

    list.innerHTML = shown.length
      ? shown
          .map((item) => {
            const external = isExternal(item.url);
            const href = external ? item.url : siteHref(item.url || '#');
            return `
        <li class="news-item">
          <div class="news-item__meta">
            <time datetime="${esc(item.tarikh)}">${esc(formatDate(item.tarikh))}</time>
            ${item.kategori ? `<span class="card__tag">${esc(item.kategori)}</span>` : ''}
          </div>
          <h3 class="news-item__title">
            <a href="${esc(href)}"${
              external ? ' target="_blank" rel="noopener noreferrer"' : ''
            }>${esc(item.tajuk)}</a>
          </h3>
          ${item.ringkas ? `<p>${esc(item.ringkas)}</p>` : ''}
        </li>`;
          })
          .join('')
      : '<li class="empty">Tiada item dalam kategori ini.</li>';

    if (count) {
      count.textContent = `${shown.length} daripada ${items.length} item dipaparkan.`;
    }
  };

  if (filter) {
    filter.innerHTML = categories
      .map(
        (cat) => `<button type="button" class="chip" data-cat="${esc(cat)}"
          aria-pressed="${cat === active}">${esc(cat)}</button>`
      )
      .join('');

    filter.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        active = chip.dataset.cat;
        filter.querySelectorAll('.chip').forEach((other) => {
          other.setAttribute('aria-pressed', String(other === chip));
        });
        render();
      });
    });
  }

  render();
}

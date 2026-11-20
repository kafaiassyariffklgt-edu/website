/**
 * AnyFlip Module - Render AnyFlip publications
 * Data-driven from data/anyflip.json
 */

import { PATHS } from '../paths.js';

const STATE = {
  items: [],
  loaded: false
};

async function loadAnyFlipData() {
  if (STATE.loaded) return STATE.items;
  
  try {
    const res = await fetch(PATHS.data.anyflip);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    STATE.items = data.items || [];
    STATE.loaded = true;
    return STATE.items;
  } catch (err) {
    console.warn('[AnyFlip] Gagal muat data:', err);
    return [];
  }
}

function createAnyFlipSlide(item) {
  const figure = document.createElement('figure');
  figure.className = 'sorotan__slide';
  figure.dataset.sorotanSlide = '';
  figure.dataset.caption = `${item.title} - ${item.subtitle}`;
  
  const link = document.createElement('a');
  link.href = item.anyflipUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'sorotan__anyflip-link';
  
  const img = document.createElement('img');
  img.src = item.coverImage;
  img.alt = `Cover ${item.title}`;
  img.width = 1080;
  img.height = 1350;
  img.loading = 'lazy';
  img.decoding = 'async';
  
  const badge = document.createElement('span');
  badge.className = 'sorotan__anyflip-badge';
  badge.textContent = '📖 Buka di AnyFlip';
  
  link.append(img, badge);
  figure.append(link);
  
  return figure;
}

function createAnyFlipCard(item) {
  const article = document.createElement('article');
  article.className = 'card anyflip-card';
  
  const link = document.createElement('a');
  link.href = item.anyflipUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'anyflip-card__link';
  
  const img = document.createElement('img');
  img.src = item.coverImage;
  img.alt = `Cover ${item.title}`;
  img.loading = 'lazy';
  img.className = 'anyflip-card__cover';
  
  const body = document.createElement('div');
  body.className = 'anyflip-card__body';
  
  const tag = document.createElement('span');
  tag.className = 'card__tag';
  tag.textContent = item.tags?.[0] || 'AnyFlip';
  
  const title = document.createElement('h3');
  title.textContent = item.title;
  
  const subtitle = document.createElement('p');
  subtitle.className = 'anyflip-card__subtitle';
  subtitle.textContent = item.subtitle;
  
  const btn = document.createElement('span');
  btn.className = 'btn btn--gold btn--sm anyflip-card__btn';
  btn.textContent = 'Baca di AnyFlip →';
  
  body.append(tag, title, subtitle, btn);
  link.append(img, body);
  article.append(link);
  
  return article;
}

export async function initAnyFlipSlider(containerSelector = '[data-sorotan-stage]') {
  const items = await loadAnyFlipData();
  const sliderItems = items.filter(item => item.showInSlider);
  
  if (sliderItems.length === 0) return;
  
  const stage = document.querySelector(containerSelector);
  if (!stage) return;
  
  // Clear existing slides except the first one (keep original poster)
  const existingSlides = stage.querySelectorAll('.sorotan__slide:not(:first-child)');
  existingSlides.forEach(slide => slide.remove());
  
  // Append AnyFlip slides
  sliderItems.forEach(item => {
    const slide = createAnyFlipSlide(item);
    stage.append(slide);
  });
  
  // Update slide count if controls exist
  updateSlideCount();
}

export async function renderAnyFlipGrid(containerSelector, options = {}) {
  const { featuredOnly = false, limit = 0 } = options;
  const items = await loadAnyFlipData();
  
  let filtered = items;
  if (featuredOnly) filtered = items.filter(i => i.featured);
  if (limit > 0) filtered = filtered.slice(0, limit);
  
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty">Tiada penerbitan AnyFlip terkini.</p>';
    return;
  }
  
  const grid = document.createElement('div');
  grid.className = 'card-grid card-grid--auto anyflip-grid';
  
  filtered.forEach(item => {
    grid.append(createAnyFlipCard(item));
  });
  
  container.append(grid);
}

function updateSlideCount() {
  const countEl = document.querySelector('[data-sorotan-count]');
  const slides = document.querySelectorAll('[data-sorotan-slide]');
  if (countEl && slides.length) {
    countEl.textContent = `1 / ${slides.length}`;
  }
}

export function getAnyFlipItems() {
  return STATE.items;
}
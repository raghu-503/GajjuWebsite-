import { initSite } from './main.js';
import { PRODUCTS } from './data.js';
import { refreshIcons } from './icons.js';
import { productCard, PRODUCT_GRID } from './product-card.js';

const site = initSite('shop');
const grid = document.querySelector('[data-listing]');
grid.className = PRODUCT_GRID;
const sortEl = document.querySelector('[data-sort]');

function render() {
  const list = [...PRODUCTS];
  if (sortEl.value === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (sortEl.value === 'price-desc') list.sort((a, b) => b.price - a.price);
  grid.innerHTML = list.map((p) => productCard(p)).join('');
  document.querySelector('[data-count]').textContent = `${list.length} ${list.length === 1 ? 'Product' : 'Products'}`;
  refreshIcons();
}

sortEl.addEventListener('change', render);
render();
site.hydrate();

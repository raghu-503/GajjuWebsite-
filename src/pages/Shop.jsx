import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard, { PRODUCT_GRID } from '../components/ProductCard.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { PRODUCTS } from '../js/data.js';

export default function Shop() {
  useDocumentTitle('Shop robots and kits · Gajju');
  const [sort, setSort] = useState('featured');
  const mainRef = useRef(null);
  useReveals(mainRef);

  const list = [...PRODUCTS];
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);

  return (
    <main id="main" className="page" ref={mainRef}>
      <div className="mx-auto max-w-[1120px] px-(--pad)">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-step-2 font-bold">Shop All Products</h1>
            <p className="mt-[0.4rem] text-muted">Explore our robotics products and engineering kits.</p>
          </div>
          <nav className="text-[0.88rem] text-muted" aria-label="Breadcrumb">
            <Link className="hover:text-accent" to="/">
              Home
            </Link>{' '}
            / <span className="text-fg" aria-current="page">Shop</span>
          </nav>
        </header>
        <div className="mb-5 flex items-center justify-between gap-4">
          <strong>
            {list.length} {list.length === 1 ? 'Product' : 'Products'}
          </strong>
          <label className="inline-flex items-center gap-[0.35rem] rounded-full border border-line bg-surface px-[0.8rem] py-[0.35rem] text-[0.86rem] font-semibold">
            <span>Sort:</span>
            <select
              className="cursor-pointer border-0 bg-transparent font-semibold outline-none [&_option]:bg-surface"
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
        <div className={PRODUCT_GRID}>
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </main>
  );
}

import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout.jsx';
// Pages are lazy (one chunk each); Layout wraps them in <Suspense>.
import { Home, Shop, Product, Cart, Checkout, GajjuMini, BuildLog, Schools, Parents, About, Founding, Privacy, Terms } from './routes.js';
import { SHOP_ENABLED, PHASE2_ENABLED } from './config/features.js';

/** Remount the product page per id so its 3D viewer and reveals start fresh. */
function ProductRoute() {
  const { id } = useParams();
  return <Product key={id} id={id} />;
}

/** Old multi-page URLs (product.html?id=…, shop.html, …) keep working. */
function LegacyRedirect({ to }) {
  const { search, hash } = useLocation();
  const params = new URLSearchParams(search);
  if (to === 'product') {
    const id = params.get('id');
    return <Navigate to={id ? `/product/${encodeURIComponent(id)}${hash}` : '/shop'} replace />;
  }
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

const toHome = <Navigate to="/" replace />;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="gajju-mini" element={<GajjuMini />} />
        <Route path="build-log" element={<BuildLog />} />
        {/* Phase 2 (For schools, For parents): hidden unless VITE_ENABLE_PHASE2=true
            (config/features.js). While hidden, both addresses redirect to Home. */}
        <Route path="schools" element={PHASE2_ENABLED ? <Schools /> : toHome} />
        <Route path="parents" element={PHASE2_ENABLED ? <Parents /> : toHome} />
        <Route path="about" element={<About />} />
        <Route path="founding" element={<Founding />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />

        {/* Phase 4 shop: off unless VITE_ENABLE_SHOP=true (config/features.js). While off, every
            shop address, old or new, redirects to Home. */}
        <Route path="shop" element={SHOP_ENABLED ? <Shop /> : toHome} />
        <Route path="product/:id" element={SHOP_ENABLED ? <ProductRoute /> : toHome} />
        <Route path="cart" element={SHOP_ENABLED ? <Cart /> : toHome} />
        <Route path="checkout" element={SHOP_ENABLED ? <Checkout /> : toHome} />

        <Route path="index.html" element={<LegacyRedirect to="/" />} />
        <Route path="shop.html" element={SHOP_ENABLED ? <LegacyRedirect to="/shop" /> : toHome} />
        <Route path="product.html" element={SHOP_ENABLED ? <LegacyRedirect to="product" /> : toHome} />
        <Route path="cart.html" element={SHOP_ENABLED ? <LegacyRedirect to="/cart" /> : toHome} />
        <Route path="checkout.html" element={SHOP_ENABLED ? <LegacyRedirect to="/checkout" /> : toHome} />
        <Route path="*" element={toHome} />
      </Route>
    </Routes>
  );
}

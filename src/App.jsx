import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';

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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:id" element={<ProductRoute />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />

        <Route path="index.html" element={<LegacyRedirect to="/" />} />
        <Route path="shop.html" element={<LegacyRedirect to="/shop" />} />
        <Route path="product.html" element={<LegacyRedirect to="product" />} />
        <Route path="cart.html" element={<LegacyRedirect to="/cart" />} />
        <Route path="checkout.html" element={<LegacyRedirect to="/checkout" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

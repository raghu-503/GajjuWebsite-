// React entry: global styles, router and the app shell.
import './css/tailwind.css'; // first: declares the cascade layer order
import './css/global.css';
import './css/navigation.css';
import './css/animations.css';
import './css/home.css';
import './css/products.css';
import './css/commerce.css';
import './css/responsive.css';
import './css/gajju-home.css'; // Gajju brand tokens + Home page (scoped); after the old CSS so it wins
import './css/gajju-chrome.css'; // Gajju brand: shared header, mobile menu and footer (every route)
import './css/gajju-pages.css'; // Gajju brand: Gajju Mini, Build log and About pages

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { preloadPath } from './routes.js';

document.documentElement.classList.add('has-js');
preloadPath(window.location.pathname); // fetch this page's chunk alongside React's first render

createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>,
);

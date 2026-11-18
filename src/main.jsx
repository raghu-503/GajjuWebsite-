// React entry: global styles, router and the app shell.
import './css/tailwind.css'; // first: declares the cascade layer order
import './css/global.css';
import './css/navigation.css';
import './css/animations.css';
import './css/home.css';
import './css/products.css';
import './css/commerce.css';
import './css/responsive.css';

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

document.documentElement.classList.add('has-js');

createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>,
);

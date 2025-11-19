import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import useThemeStore from './store/themeStore.js';
import useProductStore from './store/productStore.js';

const { initializeTheme } = useThemeStore.getState();
initializeTheme();
const { initializeProducts } = useProductStore.getState();
initializeProducts();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

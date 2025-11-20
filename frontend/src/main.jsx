import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import useThemeStore from './store/themeStore.js';
import useProductStore from './store/productStore.js';
import useCustomerStyleStore from './store/customerStyleStore.js';

const { initializeTheme } = useThemeStore.getState();
initializeTheme();
const { initializeProducts } = useProductStore.getState();
initializeProducts();
const { initializeStyles } = useCustomerStyleStore.getState();
initializeStyles();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

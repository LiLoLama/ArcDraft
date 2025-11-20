import { create } from 'zustand';

const STORAGE_KEY = 'arc-products';

export const DEFAULT_PRODUCTS = [
  {
    id: 'strategy-sprint',
    name: 'Strategie Sprint',
    description: '3-tägiger Workshop mit Workshops, Research & Priorisierung.',
    price: '€4.200',
  },
  {
    id: 'ai-rollout',
    name: 'AI Rollout Paket',
    description: 'Implementierung von 2–3 Automationen inkl. Training.',
    price: '€9.800',
  },
  {
    id: 'care-plan',
    name: 'Care & Success Plan',
    description: 'Monatliche Betreuung, Optimierungen und KPI Reviews.',
    price: '€2.200 / Monat',
  },
  {
    id: 'prototype',
    name: 'Interactive Prototype',
    description: 'Klickbares Konzept inkl. Copy, UI und Microcopy.',
    price: '€6.500',
  },
];

const readStoredProducts = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to parse stored products', err);
    return null;
  }
};

const persistProducts = (products) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to persist products', err);
  }
};

const useProductStore = create((set, get) => ({
  products: DEFAULT_PRODUCTS,
  initializeProducts: () => {
    const stored = readStoredProducts();
    if (stored && Array.isArray(stored)) {
      set({ products: stored });
    } else {
      set({ products: DEFAULT_PRODUCTS });
      persistProducts(DEFAULT_PRODUCTS);
    }
  },
  addProduct: (product) => {
    const id = product.id || `product-${Date.now()}`;
    const next = [...get().products, { ...product, id }];
    persistProducts(next);
    set({ products: next });
    return id;
  },
  updateProduct: (id, updates) => {
    const next = get().products.map((product) => (product.id === id ? { ...product, ...updates } : product));
    persistProducts(next);
    set({ products: next });
  },
  removeProduct: (id) => {
    const next = get().products.filter((product) => product.id !== id);
    persistProducts(next);
    set({ products: next });
  },
}));

export default useProductStore;

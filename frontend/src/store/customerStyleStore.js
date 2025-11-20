import { create } from 'zustand';

const STORAGE_KEY = 'arc-customer-styles';

export const DEFAULT_CUSTOMER_STYLES = [
  {
    id: 'corporate-de',
    name: 'Corporate DACH',
    tone: 'seriös',
    language: 'de',
    description: 'Formell, präzise und auf Entscheider:innen in DACH ausgerichtet.',
  },
  {
    id: 'friendly-en',
    name: 'Startup Friendly',
    tone: 'casual',
    language: 'en',
    description: 'Locker, lösungsorientiert und in modernem Englisch gehalten.',
  },
];

const readStoredStyles = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to parse stored customer styles', err);
    return null;
  }
};

const persistStyles = (styles) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
  } catch (err) {
    console.error('Failed to persist customer styles', err);
  }
};

const useCustomerStyleStore = create((set, get) => ({
  styles: DEFAULT_CUSTOMER_STYLES,
  initializeStyles: () => {
    const stored = readStoredStyles();
    if (stored && Array.isArray(stored)) {
      set({ styles: stored });
    } else {
      set({ styles: DEFAULT_CUSTOMER_STYLES });
      persistStyles(DEFAULT_CUSTOMER_STYLES);
    }
  },
  addStyle: (style) => {
    const id = style.id || `customer-style-${Date.now()}`;
    const next = [...get().styles, { ...style, id }];
    persistStyles(next);
    set({ styles: next });
    return id;
  },
  updateStyle: (id, updates) => {
    const next = get().styles.map((style) => (style.id === id ? { ...style, ...updates } : style));
    persistStyles(next);
    set({ styles: next });
  },
  removeStyle: (id) => {
    const next = get().styles.filter((style) => style.id !== id);
    persistStyles(next);
    set({ styles: next });
  },
}));

export default useCustomerStyleStore;

import { create } from 'zustand';

const STORAGE_KEY = 'arc-customers';

const DEFAULT_CUSTOMERS = [
  {
    id: 'customer-1',
    name: 'Alex Kunde',
    company: 'Kunden GmbH',
    email: 'alex.kunde@example.com',
    notes: 'Bevorzugt kurze Mails und wöchentliche Updates.',
    styleId: 'corporate-de',
    useCustomerStyle: false,
    styleLanguage: '',
    styleTone: '',
    styleDescription: '',
  },
  {
    id: 'customer-2',
    name: 'Jamie Founder',
    company: 'SeedStart AG',
    email: 'jamie@seedstart.com',
    notes: 'Interessiert an klarer Roadmap und Pricing-Transparenz.',
    styleId: 'friendly-en',
    useCustomerStyle: false,
    styleLanguage: '',
    styleTone: '',
    styleDescription: '',
  },
];

const normalizeCustomers = (list) =>
  list.map((customer) => {
    const hasCustomStyle = Boolean(customer.styleTone || customer.styleLanguage || customer.styleDescription);
    const useCustomStyle = customer.useCustomerStyle && hasCustomStyle;
    return {
      ...customer,
      styleLanguage: customer.styleLanguage || '',
      styleTone: customer.styleTone || '',
      styleDescription: customer.styleDescription || '',
      useCustomerStyle: Boolean(useCustomStyle),
      styleId: useCustomStyle ? '' : customer.styleId || '',
    };
  });

const readStored = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to parse stored customers', err);
    return null;
  }
};

const persist = (customers) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to persist customers', err);
  }
};

const useCustomerStore = create((set, get) => ({
  customers: DEFAULT_CUSTOMERS,
  initialize: () => {
    const stored = readStored();
    if (stored && Array.isArray(stored)) {
      const normalized = normalizeCustomers(stored);
      set({ customers: normalized });
    } else {
      set({ customers: DEFAULT_CUSTOMERS });
      persist(DEFAULT_CUSTOMERS);
    }
  },
  addCustomer: (customer) => {
    const id = customer.id || `customer-${Date.now()}`;
    const nextCustomer = {
      ...customer,
      id,
      styleLanguage: customer.styleLanguage || '',
      styleTone: customer.styleTone || '',
      styleDescription: customer.styleDescription || '',
      useCustomerStyle: customer.useCustomerStyle ?? Boolean(customer.styleTone || customer.styleLanguage || customer.styleDescription),
      styleId: customer.useCustomerStyle ? '' : customer.styleId || '',
    };
    const next = [...get().customers, nextCustomer];
    persist(next);
    set({ customers: next });
    return id;
  },
  updateCustomer: (id, updates) => {
    const next = get().customers.map((customer) =>
      customer.id === id
        ? {
            ...customer,
            ...updates,
            styleLanguage: updates.styleLanguage ?? customer.styleLanguage ?? '',
            styleTone: updates.styleTone ?? customer.styleTone ?? '',
            styleDescription: updates.styleDescription ?? customer.styleDescription ?? '',
            useCustomerStyle:
              updates.useCustomerStyle ??
              customer.useCustomerStyle ??
              Boolean(updates.styleTone || updates.styleLanguage || updates.styleDescription),
            styleId:
              updates.useCustomerStyle || customer.useCustomerStyle
                ? ''
                : updates.styleId ?? customer.styleId ?? '',
          }
        : customer,
    );
    persist(next);
    set({ customers: next });
  },
  removeCustomer: (id) => {
    const next = get().customers.filter((customer) => customer.id !== id);
    persist(next);
    set({ customers: next });
  },
}));

export default useCustomerStore;

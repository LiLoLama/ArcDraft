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
    useCustomerStyle: true,
  },
  {
    id: 'customer-2',
    name: 'Jamie Founder',
    company: 'SeedStart AG',
    email: 'jamie@seedstart.com',
    notes: 'Interessiert an klarer Roadmap und Pricing-Transparenz.',
    styleId: 'friendly-en',
    useCustomerStyle: true,
  },
];

const normalizeCustomers = (list) =>
  list.map((customer) => ({ ...customer, useCustomerStyle: customer.useCustomerStyle ?? Boolean(customer.styleId) }));

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
      useCustomerStyle: customer.useCustomerStyle ?? Boolean(customer.styleId),
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
            useCustomerStyle:
              updates.useCustomerStyle ?? customer.useCustomerStyle ?? Boolean(updates.styleId ?? customer.styleId),
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

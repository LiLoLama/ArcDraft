import { create } from 'zustand';
import { apiRequest } from '../api/client';

const useBrandingStore = create((set, get) => ({
  branding: null,
  hasLoaded: false,
  fetchBranding: async (token) => {
    if (!token) return get().branding;
    const data = await apiRequest('/api/settings/branding', { token });
    set({ branding: data, hasLoaded: true });
    return data;
  },
  saveBranding: async (token, payload) => {
    if (!token) return get().branding;
    const data = await apiRequest('/api/settings/branding', { method: 'PUT', token, body: payload });
    set({ branding: data, hasLoaded: true });
    return data;
  },
  setBranding: (branding) => set({ branding, hasLoaded: true }),
}));

export default useBrandingStore;

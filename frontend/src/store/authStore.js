import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('arcdraft_token'),
  user: JSON.parse(localStorage.getItem('arcdraft_user') || 'null'),
  setAuth: ({ token, user }) => {
    localStorage.setItem('arcdraft_token', token);
    localStorage.setItem('arcdraft_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('arcdraft_token');
    localStorage.removeItem('arcdraft_user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;

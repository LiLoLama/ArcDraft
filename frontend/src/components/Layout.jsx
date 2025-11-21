import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useBrandingStore from '../store/brandingStore';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/templates', label: 'Templates' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/customers', label: 'Kunden' },
  { to: '/products', label: 'Products' },
  { to: '/settings/branding', label: 'Settings' },
];

export function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const branding = useBrandingStore((s) => s.branding);
  const fetchBranding = useBrandingStore((s) => s.fetchBranding);
  const brandingLoaded = useBrandingStore((s) => s.hasLoaded);

  useEffect(() => {
    if (!token || brandingLoaded) return;
    fetchBranding(token);
  }, [brandingLoaded, fetchBranding, token]);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">ArcDraft</div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-block">
            {branding?.logoUrl && <img src={branding.logoUrl} alt="Logo" className="user-logo" />}
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-company">{user?.companyName}</div>
            </div>
          </div>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Profil
          </NavLink>
          <button className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export function PublicLayout({ children }) {
  return <div className="public-shell">{children}</div>;
}

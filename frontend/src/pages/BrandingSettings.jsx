import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

export default function BrandingSettingsPage() {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({ logoUrl: '', primaryColor: '#3EF0E7', accentColor: '#FF6A3D', fontFamily: 'Inter' });
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/settings/branding', { token }).then(setForm);
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    const saved = await apiRequest('/api/settings/branding', { method: 'PUT', token, body: form });
    setForm(saved);
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Branding</h1>
          <p className="muted">Passe Branding und Darstellung deiner App zentral an.</p>
        </div>
        <button className="primary" onClick={handleSave}>
          Speichern
        </button>
      </div>
      <section className="appearance-card">
        <div className="section-header">
          <div>
            <p className="tagline">Interface</p>
            <h2>Darstellung & Theme</h2>
            <p className="muted">Dark Mode ist die Voreinstellung und nur hier änderbar.</p>
          </div>
        </div>
        <div className="theme-options">
          {[
            { id: 'dark', label: 'Dunkler Modus', description: 'Beste Lesbarkeit, hohe Kontraste.' },
            { id: 'light', label: 'Heller Modus', description: 'Klassischer Look mit mehr Weißraum.' },
          ].map((option) => (
            <label key={option.id} className={`theme-option ${theme === option.id ? 'selected' : ''}`}>
              <input type="radio" name="theme" value={option.id} checked={theme === option.id} onChange={handleThemeChange} />
              <span className="theme-label">{option.label}</span>
              <span className="muted">{option.description}</span>
            </label>
          ))}
        </div>
      </section>
      <div className="grid grid-2">
        <label>
          Logo URL
          <input name="logoUrl" value={form.logoUrl || ''} onChange={handleChange} />
        </label>
        <label>
          Primary Color
          <input name="primaryColor" value={form.primaryColor || ''} onChange={handleChange} />
        </label>
        <label>
          Accent Color
          <input name="accentColor" value={form.accentColor || ''} onChange={handleChange} />
        </label>
        <label>
          Font Family
          <input name="fontFamily" value={form.fontFamily || ''} onChange={handleChange} />
        </label>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';

export default function BrandingSettingsPage() {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({ logoUrl: '', primaryColor: '#3EF0E7', accentColor: '#FF6A3D', fontFamily: 'Inter' });

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/settings/branding', { token }).then(setForm);
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    const saved = await apiRequest('/api/settings/branding', { method: 'PUT', token, body: form });
    setForm(saved);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Branding</h1>
        <button className="primary" onClick={handleSave}>
          Speichern
        </button>
      </div>
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

import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';

export default function SecuritySettingsPage() {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({ requireProposalPasscode: false, globalPasscode: '' });

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/settings/security', { token }).then(setForm);
  }, [token]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async () => {
    const saved = await apiRequest('/api/settings/security', { method: 'PUT', token, body: form });
    setForm(saved);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Security</h1>
        <button className="primary" onClick={handleSave}>
          Speichern
        </button>
      </div>
      <label className="checkbox">
        <input type="checkbox" name="requireProposalPasscode" checked={!!form.requireProposalPasscode} onChange={handleChange} />
        Alle Proposals benötigen Passcode
      </label>
      <label>
        Globaler Passcode
        <input name="globalPasscode" value={form.globalPasscode || ''} onChange={handleChange} />
      </label>
    </div>
  );
}

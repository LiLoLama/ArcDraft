import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';

export default function AutomationSettingsPage() {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({ webhookUrl: '', apiKey: '' });

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/settings/n8n', { token }).then(setForm);
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    const saved = await apiRequest('/api/settings/n8n', { method: 'PUT', token, body: form });
    setForm(saved);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Automation / n8n</h1>
        <button className="primary" onClick={handleSave}>
          Speichern
        </button>
      </div>
      <label>
        Webhook URL
        <input name="webhookUrl" value={form.webhookUrl || ''} onChange={handleChange} />
      </label>
      <label>
        API Key / Secret
        <input name="apiKey" value={form.apiKey || ''} onChange={handleChange} />
      </label>
      <p className="muted small">Der Backend-Server ruft diesen Webhook für AI-Generierung auf.</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';

const emptyForm = { name: '', companyName: '', email: '', currentPassword: '', newPassword: '' };

export default function ProfilePage() {
  const token = useAuthStore((s) => s.token);
  const storedUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/profile', { token })
      .then((res) => {
        setForm((prev) => ({ ...prev, ...res.user }));
      })
      .catch(() => {
        if (storedUser) {
          setForm((prev) => ({ ...prev, ...storedUser }));
        }
      });
  }, [storedUser, token]);

  const handleChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const res = await apiRequest('/api/profile', { method: 'PUT', token, body: form });
      setStatus('Profil aktualisiert.');
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setAuth({ token, user: res.user });
    } catch (err) {
      setError(err.message || 'Aktualisierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profil</h1>
          <p className="muted">Passe deine Account-Informationen und dein Passwort an.</p>
        </div>
      </div>

      <form className="section-card" onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Unternehmen
            <input name="companyName" value={form.companyName} onChange={handleChange} required />
          </label>
        </div>
        <label>
          E-Mail
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>

        <div className="section-header">
          <div>
            <h3>Passwort</h3>
            <p className="muted">Optional kannst du hier dein Passwort ändern.</p>
          </div>
        </div>
        <div className="grid grid-2">
          <label>
            Aktuelles Passwort
            <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} />
          </label>
          <label>
            Neues Passwort
            <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} />
          </label>
        </div>

        {status && <p className="success-msg">{status}</p>}
        {error && <p className="error-msg">{error}</p>}

        <div className="modal-actions">
          <div />
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Speichern…' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}

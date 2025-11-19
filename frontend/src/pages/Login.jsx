import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@arcdraft.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
      setAuth(data);
      navigate('/');
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>ArcDraft</h1>
        <p>AI-native Proposals, orchestriert.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Passwort
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          {error && <div className="error-msg">{error}</div>}
          <button className="primary" type="submit">
            Login
          </button>
        </form>
        <p className="muted small">Demo Zugang ist vorausgefüllt.</p>
      </div>
    </div>
  );
}

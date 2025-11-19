import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/analytics/overview', { token }).then(setMetrics);
    apiRequest('/api/proposals?status=sent', { token }).then((data) => setRecent(data.slice(-5)));
  }, [token]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Alle Proposal-Signale auf einen Blick.</p>
        </div>
        <button className="primary" onClick={() => setShowGenerator(true)}>
          Neues Proposal mit AI
        </button>
      </div>
      <div className="grid grid-4">
        <MetricCard label="Proposals" value={metrics?.proposalsTotal ?? '—'} />
        <MetricCard label="Signiert" value={metrics?.proposalsSigned ?? '—'} accent="green" />
        <MetricCard label="Conversion" value={`${metrics?.conversionRate ?? 0}%`} accent="cyan" />
        <MetricCard label="Views 30d" value={metrics?.viewsLast30Days ?? 0} accent="orange" />
      </div>
      <section>
        <h2>Zuletzt gesendete Proposals</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Kunde</th>
              <th>Status</th>
              <th>Letzte Aktivität</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((proposal) => (
              <tr key={proposal.id}>
                <td>{proposal.title}</td>
                <td>{proposal.recipient?.name}</td>
                <td>
                  <StatusBadge status={proposal.status} />
                </td>
                <td>{proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {showGenerator && <AiGeneratorModal onClose={() => setShowGenerator(false)} />}
    </div>
  );
}

function AiGeneratorModal({ onClose }) {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    projectTitle: '',
    projectDescription: '',
    budgetRange: '',
    tone: 'bold',
    language: 'de',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = await apiRequest('/api/proposals/ai-generate', { method: 'POST', body: form, token });
    setResult(payload.proposal);
    setLoading(false);
  };

  return (
    <div className="modal">
      <div className="modal-card">
        <header>
          <h3>AI Proposal Builder</h3>
          <button onClick={onClose}>×</button>
        </header>
        {!result ? (
          <form onSubmit={handleSubmit} className="grid grid-2">
            {Object.entries(form).map(([key, value]) => (
              <label key={key} className="span-2">
                {key}
                <input name={key} value={value} onChange={handleChange} required={key !== 'budgetRange'} />
              </label>
            ))}
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Generiere…' : 'Generieren'}
            </button>
          </form>
        ) : (
          <div>
            <p>Proposal "{result.title}" erstellt.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { StatusBadge } from '../components/StatusBadge';

export default function ProposalsListPage() {
  const token = useAuthStore((s) => s.token);
  const [proposals, setProposals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    const query = statusFilter ? `?status=${statusFilter}` : '';
    apiRequest(`/api/proposals${query}`, { token }).then(setProposals);
  }, [token, statusFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Proposals</h1>
          <p className="muted">Verwalte AI-generierte Dokumente.</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Alle</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="signed">Signed</option>
        </select>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th className="text-center">Kunde</th>
            <th className="text-center">Status</th>
            <th className="text-center">Views</th>
            <th className="text-center">Signiert</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr key={proposal.id}>
              <td>
                <Link to={`/proposals/${proposal.id}`}>{proposal.title}</Link>
              </td>
              <td className="text-center">{proposal.recipient?.name}</td>
              <td className="text-center">
                <StatusBadge status={proposal.status} />
              </td>
              <td className="text-center">{proposal.viewedAt ? 'Viewed' : '—'}</td>
              <td className="text-center">{proposal.signedAt ? new Date(proposal.signedAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

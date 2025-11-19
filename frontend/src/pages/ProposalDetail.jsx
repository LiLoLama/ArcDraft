import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { StatusBadge } from '../components/StatusBadge';
import { ProposalPreview } from '../components/ProposalPreview';

export default function ProposalDetailPage() {
  const token = useAuthStore((s) => s.token);
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);

  useEffect(() => {
    if (!token) return;
    apiRequest(`/api/proposals/${id}`, { token }).then(setProposal);
  }, [id, token]);

  if (!proposal) return <p>Lade…</p>;

  const publicUrl = `${window.location.origin}/p/${proposal.publicSlug}`;

  const updateStatus = async (status) => {
    const updated = await apiRequest(`/api/proposals/${id}`, { method: 'PUT', token, body: { status } });
    setProposal(updated);
  };

  return (
    <div className="page proposal-detail">
      <div className="page-header">
        <div>
          <h1>{proposal.title}</h1>
          <p className="muted">{proposal.recipient?.name}</p>
        </div>
        <div className="actions">
          <button className="ghost-button" onClick={() => navigator.clipboard.writeText(publicUrl)}>
            Public Link kopieren
          </button>
          <Link to={`/proposals/${id}/analytics`} className="ghost-button">
            Analytics
          </Link>
          <button className="primary" onClick={() => updateStatus('sent')}>
            Mark as Sent
          </button>
        </div>
      </div>
      <div className="meta-grid">
        <div>
          <h4>Status</h4>
          <StatusBadge status={proposal.status} />
        </div>
        <div>
          <h4>Template</h4>
          <p>{proposal.templateId || '—'}</p>
        </div>
        <div>
          <h4>Erstellt</h4>
          <p>{new Date(proposal.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <h4>Public URL</h4>
          <a href={publicUrl} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </div>
      </div>
      <ProposalPreview proposal={proposal} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { StatusBadge } from '../components/StatusBadge';

export default function TemplatesListPage() {
  const token = useAuthStore((s) => s.token);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/templates', { token }).then(setTemplates);
  }, [token]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Templates</h1>
          <p className="muted">Kuratiere strukturierte Bausteine für AI.</p>
        </div>
        <Link to="/templates/new" className="primary">
          Neues Template
        </Link>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Zuletzt geändert</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id}>
              <td>
                <Link to={`/templates/${template.id}`}>{template.name}</Link>
                <p className="muted small">{template.description}</p>
              </td>
              <td className="text-center">
                <StatusBadge status={template.status} />
              </td>
              <td className="text-center">{template.updatedAt ? new Date(template.updatedAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

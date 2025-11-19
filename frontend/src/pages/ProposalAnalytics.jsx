import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { MetricCard } from '../components/MetricCard';

export default function ProposalAnalyticsPage() {
  const token = useAuthStore((s) => s.token);
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!token) return;
    apiRequest(`/api/proposals/${id}/analytics`, { token }).then(setAnalytics);
  }, [id, token]);

  if (!analytics) return <p>Lade Analytics…</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Proposal Analytics</h1>
      </div>
      <div className="grid grid-4">
        <MetricCard label="Views" value={analytics.totalViews} />
        <MetricCard label="Letzte Ansicht" value={analytics.lastViewedAt ? new Date(analytics.lastViewedAt).toLocaleString() : '—'} />
        <MetricCard label="Signiert" value={analytics.signedAt ? new Date(analytics.signedAt).toLocaleDateString() : 'Nein'} />
      </div>
      <section>
        <h2>Section Insights</h2>
        <div className="section-insights">
          {analytics.sectionViewStats.map((stat) => (
            <div key={stat.sectionId} className="section-bar">
              <div>
                <strong>{stat.sectionId}</strong>
                <span>{stat.viewCount} Views</span>
              </div>
              <div className="bar">
                <div style={{ width: `${Math.min(stat.avgTimeOnSection / 1000, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Timeline</h2>
        <ul className="timeline">
          {analytics.eventsTimeline.map((event) => (
            <li key={event.id}>
              <span>{event.eventType}</span>
              <small>{new Date(event.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

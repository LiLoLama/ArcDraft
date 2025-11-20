const statusColors = {
  draft: 'badge-gray',
  ready_to_send: 'badge-green',
  sent: 'badge-green',
  viewed: 'badge-cyan',
  signed: 'badge-green',
  declined: 'badge-red',
  expired: 'badge-orange',
};

export function StatusBadge({ status }) {
  return <span className={`status-badge ${statusColors[status] || 'badge-gray'}`}>{status?.replaceAll('_', ' ')}</span>;
}

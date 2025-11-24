const statusColors = {
  draft: 'badge-gray',
  ready_to_send: 'badge-green',
  sent: 'badge-green',
  viewed: 'badge-cyan',
  signed: 'badge-green',
  signiert: 'badge-green',
  declined: 'badge-red',
  expired: 'badge-orange',
};

export function StatusBadge({ status }) {
  const displayLabel = status === 'signed' ? 'signiert' : status?.replaceAll('_', ' ');
  return <span className={`status-badge ${statusColors[status] || 'badge-gray'}`}>{displayLabel}</span>;
}

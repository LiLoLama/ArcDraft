export function MetricCard({ label, value, accent }) {
  return (
    <div className={`metric-card ${accent || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

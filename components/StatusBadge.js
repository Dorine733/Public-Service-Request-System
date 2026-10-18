export default function StatusBadge({ status }) {
  const cls = status === 'Resolved' ? 'green' : status === 'In Progress' ? 'blue' : 'amber';
  return <span className={`badge ${cls}`}>{status}</span>;
}

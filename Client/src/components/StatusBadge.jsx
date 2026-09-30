const STATUS_CONFIG = {
  Open: { color: 'success', icon: '🟢' },
  'In Progress': { color: 'primary', icon: '🔵' },
  Submitted: { color: 'warning', icon: '🟡' },
  Completed: { color: 'info', icon: '✅' },
  Cancelled: { color: 'secondary', icon: '⛔' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: 'secondary', icon: '⚪' };
  return (
    <span className={`badge bg-${cfg.color}-subtle text-${cfg.color} border border-${cfg.color}-subtle rounded-pill px-3 py-1 small fw-semibold`}>
      {cfg.icon} {status}
    </span>
  );
}

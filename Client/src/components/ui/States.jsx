/**
 * Shared UI states: Loading, Error, Empty.
 * Keeps every page consistent for the three required app states.
 */

export function LoadingState({ label = 'Loading…', full = false }) {
  return (
    <div className={`fh-state ${full ? 'py-5' : ''}`} role="status" aria-live="polite">
      <div
        className="spinner-border text-primary mx-auto mb-3"
        style={{ width: '2.6rem', height: '2.6rem' }}
      />
      <p className="mb-0 small">{label}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="fh-state" role="alert">
      <div className="fh-state-icon">⚠️</div>
      <div className="fh-state-title">Couldn&apos;t load this content</div>
      <p className="small mb-3">{message}</p>
      {onRetry && (
        <button className="btn btn-outline-primary rounded-3 px-4" onClick={onRetry}>
          🔄 Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', hint, action }) {
  return (
    <div className="fh-state">
      <div className="fh-state-icon">{icon}</div>
      <div className="fh-state-title">{title}</div>
      {hint && <p className="small mb-3">{hint}</p>}
      {action}
    </div>
  );
}

export default LoadingState;

/**
 * Read-only display of submitted work (used by client review + freelancer view).
 * Action buttons are passed in as `children`.
 */
export default function SubmissionPanel({ submission, title = 'Submitted Work', children }) {
  if (!submission || !submission.submittedAt) return null;

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 border-start border-primary border-3">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-3">
        <h5 className="fw-bold mb-0">📤 {title}</h5>
        <small className="text-muted">
          Submitted {new Date(submission.submittedAt).toLocaleString([], {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </small>
      </div>

      {submission.projectLink && (
        <div className="mb-3">
          <div className="fw-semibold text-muted small mb-1">Project Link</div>
          <a
            href={submission.projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary btn-sm rounded-3 text-break"
          >
            🔗 {submission.projectLink}
          </a>
        </div>
      )}

      {submission.description && (
        <div className="mb-3">
          <div className="fw-semibold text-muted small mb-1">Description</div>
          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{submission.description}</p>
        </div>
      )}

      {submission.files?.length > 0 && (
        <div className="mb-2">
          <div className="fw-semibold text-muted small mb-1">Attachments</div>
          <div className="d-flex flex-wrap gap-2">
            {submission.files.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="badge bg-light text-primary border rounded-pill px-3 py-2 text-decoration-none"
              >
                📎 {f.filename || `File ${i + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

      {children && <div className="d-flex flex-wrap gap-2 mt-3">{children}</div>}
    </div>
  );
}

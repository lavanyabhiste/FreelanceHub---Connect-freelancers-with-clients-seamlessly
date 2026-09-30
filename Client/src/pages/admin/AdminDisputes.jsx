import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';

const STATUS_META = {
  Open: { cls: 'bg-danger', icon: '🔴', next: 'Under Review', action: '🔍 Start Review' },
  'Under Review': { cls: 'bg-warning text-dark', icon: '🟡', next: 'Resolved', action: '✅ Resolve' },
  Resolved: { cls: 'bg-info text-dark', icon: '🔵', next: 'Closed', action: '🔒 Close' },
  Closed: { cls: 'bg-secondary', icon: '⚪', next: null, action: null },
};

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getDisputes({ status: status || undefined, limit: 50 });
      setDisputes(res.disputes);
      setSummary(res.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load disputes.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (d) => {
    if (expandedId === d._id) {
      setExpandedId(null);
    } else {
      setExpandedId(d._id);
      setNote(d.adminNote || '');
      setResolution(d.resolution || '');
    }
  };

  const advanceStatus = async (d) => {
    const meta = STATUS_META[d.status];
    if (!meta?.next) return;

    if (meta.next === 'Resolved' && !resolution.trim()) {
      toast.error('Please write a resolution before resolving the dispute.');
      return;
    }
    const confirmMsg =
      meta.next === 'Under Review' ? 'Start reviewing this dispute?' :
      meta.next === 'Resolved' ? `Resolve this dispute? Resolution: "${resolution.trim()}"` :
      'Close this dispute? This is the final step.';
    if (!window.confirm(confirmMsg)) return;

    setActionId(d._id);
    try {
      const res = await adminService.updateDispute(d._id, {
        status: meta.next,
        note: note.trim(),
        resolution: resolution.trim(),
      });
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setActionId(null);
    }
  };

  const saveNotes = async (d) => {
    setActionId(d._id);
    try {
      const res = await adminService.updateDispute(d._id, { note: note.trim(), resolution: resolution.trim() });
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">⚖️ Dispute Management</h3>
          <p className="text-muted mb-0">Open → Under Review → Resolved → Closed</p>
        </div>
        <select className="form-select rounded-3" style={{ width: 190 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Lifecycle summary */}
      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">🔴 Open</div>
              <div className="fw-bold fs-5 text-danger">{summary.open}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">🟡 Under Review</div>
              <div className="fw-bold fs-5 text-warning">{summary.underReview}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">🔵 Resolved</div>
              <div className="fw-bold fs-5 text-info">{summary.resolved}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">⚪ Closed</div>
              <div className="fw-bold fs-5 text-secondary">{summary.closed}</div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute list */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : disputes.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center text-muted">
          <div style={{ fontSize: '2.5rem' }}>🕊️</div>
          <p className="mt-2 mb-0">No disputes found. Great platform health!</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {disputes.map((d) => {
            const meta = STATUS_META[d.status] || STATUS_META.Open;
            const expanded = expandedId === d._id;
            return (
              <div key={d._id} className="card border-0 rounded-4 shadow-sm overflow-hidden">
                {/* Header row */}
                <div className="p-3 d-flex flex-wrap align-items-center gap-3">
                  <span className={`badge rounded-pill px-3 py-2 ${meta.cls}`}>{meta.icon} {d.status}</span>
                  <div className="flex-grow-1" style={{ minWidth: 220 }}>
                    <div className="fw-semibold">{d.reason}</div>
                    <small className="text-muted">
                      {d.project?.title || 'Unknown project'} · Raised by {d.raisedBy?.name} vs {d.againstUser?.name}
                    </small>
                  </div>
                  <small className="text-muted">{new Date(d.createdAt).toLocaleString()}</small>
                  <button className="btn btn-sm btn-outline-primary rounded-3" onClick={() => toggleExpand(d)}>
                    {expanded ? '▲ Hide' : '▼ Details'}
                  </button>
                  {meta.next && (
                    <button
                      className="btn btn-sm btn-primary rounded-3 fw-semibold"
                      onClick={() => advanceStatus(d)}
                      disabled={actionId === d._id}
                    >
                      {actionId === d._id ? <span className="spinner-border spinner-border-sm" /> : meta.action}
                    </button>
                  )}
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-top p-3 bg-light">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="fw-semibold small mb-1">Description</div>
                        <p className="small text-muted border rounded-3 bg-white p-2" style={{ whiteSpace: 'pre-wrap' }}>
                          {d.description}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <div className="fw-semibold small mb-1">Status history</div>
                        <div className="border rounded-3 bg-white p-2 small">
                          {d.history?.length ? (
                            d.history.map((h, i) => (
                              <div key={i} className="d-flex justify-content-between border-bottom py-1 last-border">
                                <span>
                                  <strong>{h.status}</strong>
                                  {h.note ? ` — ${h.note}` : ''}
                                </span>
                                <span className="text-muted">
                                  {h.changedBy?.name ? `${h.changedBy.name} · ` : ''}
                                  {new Date(h.changedAt).toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">No history recorded.</span>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Admin review note</label>
                        <textarea
                          className="form-control rounded-3"
                          rows={3}
                          placeholder="Internal notes about the review..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Resolution (required to resolve)</label>
                        <textarea
                          className="form-control rounded-3"
                          rows={3}
                          placeholder="Final resolution communicated to both parties..."
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                        />
                      </div>
                      <div className="col-12">
                        <button
                          className="btn btn-outline-secondary btn-sm rounded-3"
                          onClick={() => saveNotes(d)}
                          disabled={actionId === d._id}
                        >
                              💾 Save notes
                        </button>
                        {d.resolvedAt && (
                          <small className="text-muted ms-2">Resolved {new Date(d.resolvedAt).toLocaleString()}</small>
                        )}
                        {d.closedAt && (
                          <small className="text-muted ms-2">Closed {new Date(d.closedAt).toLocaleString()}</small>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

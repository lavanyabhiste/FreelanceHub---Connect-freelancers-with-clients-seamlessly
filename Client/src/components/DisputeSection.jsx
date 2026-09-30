import { useEffect, useState, useCallback } from 'react';
import { disputeService } from '../services/adminService';
import { toast } from 'react-toastify';

const STATUS_BADGES = {
  Open: 'bg-danger',
  'Under Review': 'bg-warning text-dark',
  Resolved: 'bg-info text-dark',
  Closed: 'bg-secondary',
};

/**
 * Dispute status banner + "Raise Dispute" button for project detail pages.
 * @param {string} projectId
 * @param {boolean} canRaise  Whether the current user may raise (In Progress / Submitted)
 */
export default function DisputeSection({ projectId, canRaise }) {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await disputeService.getMyDisputes({ projectId });
      setDispute(res.disputes?.[0] || null);
    } catch {
      setDispute(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || !description.trim()) {
      toast.error('Please provide both a reason and a description.');
      return;
    }
    setSubmitting(true);
    try {
      await disputeService.createDispute({ projectId, reason: reason.trim(), description: description.trim() });
      toast.success('Dispute raised. Our team will review it shortly.');
      setShowModal(false);
      setReason('');
      setDescription('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <>
      {dispute ? (
        // Existing dispute banner
        <div className={`alert rounded-4 d-flex flex-wrap align-items-center gap-2 ${dispute.status === 'Open' ? 'alert-danger' : dispute.status === 'Under Review' ? 'alert-warning' : dispute.status === 'Resolved' ? 'alert-info' : 'alert-secondary'}`}>
          <span style={{ fontSize: '1.2rem' }}>⚖️</span>
          <div className="flex-grow-1">
            <strong>
              Dispute: <span className={`badge rounded-pill ${STATUS_BADGES[dispute.status]}`}>{dispute.status}</span>
            </strong>
            <div className="small">
              "{dispute.reason}" — raised by {dispute.raisedBy?.name} on{' '}
              {new Date(dispute.createdAt).toLocaleDateString()}
            </div>
            {dispute.resolution && (
              <div className="small mt-1"><strong>Resolution:</strong> {dispute.resolution}</div>
            )}
          </div>
        </div>
      ) : canRaise ? (
        // Raise dispute button
        <div className="mb-4">
          <button className="btn btn-outline-danger rounded-3 fw-semibold" onClick={() => setShowModal(true)}>
            ⚠️ Raise Dispute
          </button>
          <small className="text-muted ms-2">
            Having an issue with this project? Our team will mediate.
          </small>
        </div>
      ) : null}

      {/* Dispute modal */}
      {showModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1050, overflowY: 'auto' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered my-4">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <h4 className="modal-title fw-bold">⚖️ Raise a Dispute</h4>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4 pt-3">
                  <p className="text-muted small mb-3">
                    Describe the issue clearly. An admin will review it and move it through:
                    Open → Under Review → Resolved → Closed.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reason <span className="text-danger">*</span></label>
                    <input
                      className="form-control rounded-3"
                      placeholder="e.g. Work not delivered as agreed"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={150}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control rounded-3"
                      rows={5}
                      placeholder="Explain what happened, what you expected, and the desired outcome..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={3000}
                    />
                    <small className="text-muted">{description.length}/3000</small>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-light rounded-3 px-4" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger rounded-3 px-4 fw-semibold" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : '⚠️ Raise Dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

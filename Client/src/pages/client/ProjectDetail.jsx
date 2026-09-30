import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjectById,
  fetchProjectApplications,
  updateApplicationStatus,
  markProjectCompleted,
  requestRevision,
  clearCurrentProject,
} from '../../slices/projectSlice';
import { transactionService } from '../../services/transactionService';
import StatusBadge from '../../components/StatusBadge';
import StarRating from '../../components/StarRating';
import ReviewModal from '../../components/ReviewModal';
import WorkflowStepper from '../../components/WorkflowStepper';
import SubmissionPanel from '../../components/SubmissionPanel';
import TransactionCard from '../../components/TransactionCard';
import ReviewsSection from '../../components/ReviewsSection';
import DisputeSection from '../../components/DisputeSection';
import { toast } from 'react-toastify';

export default function ProjectDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProject: project, applications, loading, actionLoading } = useSelector((s) => s.projects);
  const { user } = useSelector((s) => s.auth);

  const [tab, setTab] = useState('overview');
  const [revisionNote, setRevisionNote] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [txnLoading, setTxnLoading] = useState(false);
  const [reviewsRefresh, setReviewsRefresh] = useState(0);

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchProjectApplications(id));
    return () => dispatch(clearCurrentProject());
  }, [id, dispatch]);

  // Load the escrow transaction for this project (once a freelancer is assigned)
  const loadTransaction = useCallback(async () => {
    try {
      const res = await transactionService.getProjectTransaction(id);
      setTransaction(res.transaction);
    } catch {
      setTransaction(null);
    }
  }, [id]);

  useEffect(() => {
    if (project?.selectedFreelancer) loadTransaction();
  }, [project?.selectedFreelancer, loadTransaction]);

  const isOwner = project?.client?._id === user?._id || project?.client === user?._id;

  const handleApprove = async (appId) => {
    if (!window.confirm('Approve this freelancer? The project will move to In Progress and escrow payment will be created.')) return;
    const res = await dispatch(updateApplicationStatus({ projectId: id, appId, status: 'Approved' }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Freelancer approved! Chat + escrow are now enabled.');
      dispatch(fetchProjectById(id));
      loadTransaction();
    } else toast.error(res.payload);
  };

  const handleReject = async (appId) => {
    if (!window.confirm('Reject this application?')) return;
    const res = await dispatch(updateApplicationStatus({ projectId: id, appId, status: 'Rejected' }));
    if (res.meta.requestStatus === 'fulfilled') toast.info('Application rejected.');
    else toast.error(res.payload);
  };

  const handleComplete = async () => {
    if (!window.confirm('Mark this project as Completed? Escrow funds will be released to the freelancer.')) return;
    const res = await dispatch(markProjectCompleted(id));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Project completed! Funds released to freelancer.');
      loadTransaction();
    } else toast.error(res.payload);
  };

  const handleRevision = async () => {
    const res = await dispatch(requestRevision({ id, note: revisionNote }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.info('Revision requested. Freelancer has been notified.');
      setRevisionNote('');
      setTab('submission');
    } else toast.error(res.payload);
  };

  // Escrow actions (mock payment provider)
  const handleTxnAction = async (action) => {
    const confirms = {
      release: 'Release the escrow funds to the freelancer now?',
      refund: 'Refund the escrow payment back to you?',
      fail: 'Simulate a payment gateway failure for this transaction?',
    };
    if (!window.confirm(confirms[action])) return;
    setTxnLoading(true);
    try {
      await transactionService[action](transaction._id);
      toast.success(
        action === 'release' ? 'Funds released to freelancer!' :
        action === 'refund' ? 'Transaction refunded.' :
        'Transaction marked as failed.'
      );
      await loadTransaction();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Transaction action failed.');
    } finally {
      setTxnLoading(false);
    }
  };

  if (loading && !project) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (!project) {
    return (
      <div className="container py-5 text-center">
        <h4>Project not found.</h4>
        <button className="btn btn-primary rounded-3 mt-3" onClick={() => navigate('/client/projects')}>Back</button>
      </div>
    );
  }

  const approvedApp = applications.find((a) => a.status === 'Approved');

  return (
    <div className="container py-5">
      {/* Back */}
      <button className="btn btn-outline-secondary btn-sm rounded-3 mb-4" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Header card */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
        <div className="row align-items-start g-3">
          <div className="col-md-8">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <h2 className="fw-bold mb-0">{project.title}</h2>
              <StatusBadge status={project.status} />
            </div>
            <div className="d-flex flex-wrap gap-3 text-muted small mb-3">
              <span>📂 {project.category}</span>
              <span>💰 ${project.budget}</span>
              <span>⏱ {project.duration}</span>
              {project.deadline && (
                <span>📅 Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
              )}
              <span>📅 Posted: {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            {project.requiredSkills?.length > 0 && (
              <div className="d-flex flex-wrap gap-1">
                {project.requiredSkills.map((sk) => (
                  <span key={sk} className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 small">{sk}</span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isOwner && (
            <div className="col-md-4 text-md-end d-flex flex-column gap-2 align-items-md-end">
              {project.status === 'Submitted' && (
                <>
                  <button className="btn btn-success rounded-3 fw-semibold" onClick={handleComplete} disabled={actionLoading}>
                    ✅ Mark Completed
                  </button>
                  <button className="btn btn-outline-warning rounded-3" onClick={() => setTab('revision')} disabled={actionLoading}>
                    🔄 Request Revision
                  </button>
                </>
              )}
              {project.status === 'Completed' && !showReviewModal && (
                <button className="btn btn-outline-primary rounded-3" onClick={() => setShowReviewModal(true)}>
                  ⭐ Leave Review
                </button>
              )}
              {project.status === 'In Progress' && project.selectedFreelancer && (
                <button className="btn btn-outline-info rounded-3" onClick={() => navigate(`/client/chat/${project._id}`)}>
                  💬 Open Chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Workflow stepper */}
      <WorkflowStepper status={project.status} hasFreelancer={!!project.selectedFreelancer} />

      {/* Dispute status / raise button */}
      <DisputeSection
        projectId={project._id}
        canRaise={isOwner && ['In Progress', 'Submitted'].includes(project.status)}
      />

      {/* Tabs */}
      {(() => {
        const tabDefs = [
          ['overview', '📄 Overview'],
          ['applications', `📨 Applications (${applications.length})`],
        ];
        if (project.submission?.submittedAt && ['Submitted', 'Completed'].includes(project.status)) {
          tabDefs.push(['submission', '📤 Submitted Work']);
        }
        if (project.selectedFreelancer) tabDefs.push(['payment', '💳 Payment']);
        if (project.status === 'Completed') tabDefs.push(['reviews', '⭐ Reviews']);
        if (project.status === 'Submitted') tabDefs.push(['revision', '🔄 Request Revision']);

        return (
          <ul className="nav nav-pills mb-4 gap-2 flex-wrap">
            {tabDefs.map(([t, label]) => (
              <li key={t} className="nav-item">
                <button
                  className={`nav-link rounded-3 px-4 fw-medium ${tab === t ? 'active' : 'text-secondary'}`}
                  onClick={() => setTab(t)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        );
      })()}

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="card border-0 rounded-4 shadow-sm p-4">
          <h5 className="fw-bold mb-3">Project Description</h5>
          <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>

          {approvedApp && (
            <>
              <hr />
              <h5 className="fw-bold mb-3">👷 Assigned Freelancer</h5>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                  style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', flexShrink: 0 }}
                >
                  {approvedApp.freelancer?.name?.charAt(0)}
                </div>
                <div>
                  <div className="fw-bold">{approvedApp.freelancer?.name}</div>
                  <StarRating rating={approvedApp.freelancer?.rating || 0} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Applications tab */}
      {tab === 'applications' && (
        <div>
          {applications.length === 0 ? (
            <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
              <div style={{ fontSize: '3rem' }}>📭</div>
              <h5 className="mt-3">No applications yet</h5>
              <p className="text-muted">Freelancers haven't applied yet. Share your project to attract talent.</p>
            </div>
          ) : (
            <div className="row g-3">
              {applications.map((app) => (
                <div key={app._id} className="col-12">
                  <div className={`card border-0 rounded-4 shadow-sm p-4 ${app.status === 'Approved' ? 'border-start border-success border-3' : ''}`}>
                    <div className="row g-3 align-items-start">
                      <div className="col-md-7">
                        <div className="d-flex align-items-center gap-3 mb-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                            style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', flexShrink: 0 }}
                          >
                            {app.freelancer?.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold">{app.freelancer?.name}</div>
                            <StarRating rating={app.freelancer?.rating || 0} />
                          </div>
                          <span className={`ms-auto badge rounded-pill ${
                            app.status === 'Approved' ? 'bg-success' :
                            app.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                          }`}>{app.status}</span>
                        </div>

                        <h6 className="fw-semibold text-primary">Proposal</h6>
                        <p className="text-muted small mb-2">{app.proposal}</p>

                        <div className="d-flex flex-wrap gap-3 small">
                          <span>💰 Bid: <strong>${app.bidAmount}</strong></span>
                          <span>⏱ Duration: <strong>{app.estimatedDuration}</strong></span>
                        </div>

                        {app.freelancer?.skills?.length > 0 && (
                          <div className="mt-2 d-flex flex-wrap gap-1">
                            {app.freelancer.skills.slice(0, 5).map((sk) => (
                              <span key={sk} className="badge bg-light text-secondary border rounded-pill small">{sk}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-md-5 d-flex flex-column gap-2 align-items-md-end">
                        {isOwner && app.status === 'Pending' && project.status === 'Open' && (
                          <>
                            <button
                              className="btn btn-success rounded-3 fw-semibold"
                              onClick={() => handleApprove(app._id)}
                              disabled={actionLoading}
                            >
                              ✅ Approve & Hire
                            </button>
                            <button
                              className="btn btn-outline-danger rounded-3"
                              onClick={() => handleReject(app._id)}
                              disabled={actionLoading}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submitted work review tab */}
      {tab === 'submission' && (
        <div>
          <SubmissionPanel submission={project.submission}>
            {isOwner && project.status === 'Submitted' && (
              <>
                <button
                  className="btn btn-success rounded-3 fw-semibold"
                  onClick={handleComplete}
                  disabled={actionLoading}
                >
                  ✅ Approve & Mark Completed
                </button>
                <button
                  className="btn btn-outline-warning rounded-3"
                  onClick={() => setTab('revision')}
                  disabled={actionLoading}
                >
                  🔄 Request Revision
                </button>
              </>
            )}
            {project.status === 'Completed' && (
              <span className="badge bg-success rounded-pill px-3 py-2">✅ Approved & Completed</span>
            )}
          </SubmissionPanel>

          {project.revisions?.length > 0 && (
            <div className="card border-0 rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">🔄 Revision History</h5>
              <div className="d-flex flex-column gap-2">
                {project.revisions.map((rev, i) => (
                  <div key={i} className="border rounded-3 p-3 small">
                    <div className="d-flex justify-content-between flex-wrap gap-2">
                      <strong>Revision #{i + 1}</strong>
                      <span className="text-muted">
                        Requested {new Date(rev.requestedAt).toLocaleString()}
                        {rev.respondedAt && ` · Resubmitted ${new Date(rev.respondedAt).toLocaleString()}`}
                      </span>
                    </div>
                    {rev.note && <p className="mb-0 mt-1 text-muted">{rev.note}</p>}
                    <span className={`badge mt-2 ${rev.respondedAt ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {rev.respondedAt ? '✓ Resubmitted' : '⏳ Awaiting resubmission'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment / escrow tab */}
      {tab === 'payment' && (
        <TransactionCard
          transaction={transaction}
          role="Client"
          loading={txnLoading}
          onRelease={() => handleTxnAction('release')}
          onRefund={() => handleTxnAction('refund')}
          onFail={() => handleTxnAction('fail')}
        />
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <ReviewsSection
          projectId={project._id}
          canReview={isOwner && project.status === 'Completed'}
          revieweeName={project.selectedFreelancer?.name}
          onLeaveReview={() => setShowReviewModal(true)}
          refreshKey={reviewsRefresh}
        />
      )}

      {/* Revision tab */}
      {tab === 'revision' && (
        <div className="card border-0 rounded-4 shadow-sm p-4">
          <h5 className="fw-bold mb-3">🔄 Request Revision</h5>
          <p className="text-muted small mb-3">
            Explain what changes you'd like the freelancer to make. They will be notified immediately.
          </p>
          <textarea
            className="form-control rounded-3 mb-3"
            rows={5}
            placeholder="Describe the revision needed..."
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
          />
          <button
            className="btn btn-warning rounded-3 fw-semibold px-4"
            onClick={handleRevision}
            disabled={actionLoading || !revisionNote.trim()}
          >
            {actionLoading ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : '🔄 Request Revision'}
          </button>
        </div>
      )}

      {/* Review modal */}
      {showReviewModal && project?.selectedFreelancer && (
        <ReviewModal
          projectId={project._id}
          reviewedUserId={
            typeof project.selectedFreelancer === 'object'
              ? project.selectedFreelancer._id
              : project.selectedFreelancer
          }
          reviewedUserName={project.selectedFreelancer?.name || 'Freelancer'}
          onClose={() => {
            setShowReviewModal(false);
            setReviewsRefresh((r) => r + 1);
          }}
        />
      )}
    </div>
  );
}

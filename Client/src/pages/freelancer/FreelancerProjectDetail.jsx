import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectById } from '../../slices/projectSlice';
import { submitBid, submitWork, fetchMyApplications } from '../../slices/freelancerSlice';
import { transactionService } from '../../services/transactionService';
import StatusBadge from '../../components/StatusBadge';
import StarRating from '../../components/StarRating';
import WorkflowStepper from '../../components/WorkflowStepper';
import SubmissionPanel from '../../components/SubmissionPanel';
import TransactionCard from '../../components/TransactionCard';
import ReviewsSection from '../../components/ReviewsSection';
import ReviewModal from '../../components/ReviewModal';
import DisputeSection from '../../components/DisputeSection';
import { toast } from 'react-toastify';

export default function FreelancerProjectDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProject: project, loading } = useSelector((s) => s.projects);
  const { applications, actionLoading } = useSelector((s) => s.freelancer);

  const [bidForm, setBidForm] = useState({ proposal: '', bidAmount: '', estimatedDuration: '' });
  const [workForm, setWorkForm] = useState({ projectLink: '', description: '', files: [] });
  const [showBidForm, setShowBidForm] = useState(false);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [reviewsRefresh, setReviewsRefresh] = useState(0);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(fetchMyApplications({ limit: 100 }));
  }, [dispatch]);

  // Load escrow transaction once a freelancer is assigned
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

  const myApplication = applications.find(
    (a) => a.project?._id === id || a.project === id
  );

  const isApproved = myApplication?.status === 'Approved';
  const hasApplied = !!myApplication;
  const canBid = project?.status === 'Open' && !hasApplied;
  const canSubmitWork = isApproved && project?.status === 'In Progress';

  // Open the work form, prefilled with the previous submission (for resubmissions)
  const openWorkForm = () => {
    if (project?.submission?.projectLink) {
      setWorkForm({
        projectLink: project.submission.projectLink || '',
        description: project.submission.description || '',
        files: project.submission.files || [],
      });
    }
    setShowWorkForm(true);
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!bidForm.proposal.trim() || !bidForm.bidAmount || !bidForm.estimatedDuration.trim()) {
      toast.error('Please fill in all bid fields.');
      return;
    }
    const res = await dispatch(submitBid({
      projectId: id,
      proposal: bidForm.proposal,
      bidAmount: Number(bidForm.bidAmount),
      estimatedDuration: bidForm.estimatedDuration,
    }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Proposal submitted successfully!');
      setShowBidForm(false);
      setBidForm({ proposal: '', bidAmount: '', estimatedDuration: '' });
    } else {
      toast.error(res.payload || 'Failed to submit proposal.');
    }
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    if (!workForm.projectLink.trim() || !workForm.description.trim()) {
      toast.error('Please provide a project link and description.');
      return;
    }
    const res = await dispatch(submitWork({
      projectId: id,
      projectLink: workForm.projectLink,
      description: workForm.description,
      files: workForm.files,
    }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Work submitted successfully!');
      setShowWorkForm(false);
      setWorkForm({ projectLink: '', description: '', files: [] });
    } else {
      toast.error(res.payload || 'Failed to submit work.');
    }
  };

  if (loading && !project) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (!project) {
    return (
      <div className="container py-5 text-center">
        <h4>Project not found.</h4>
        <button className="btn btn-primary rounded-3 mt-3" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

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
          <div className="col-md-4 text-md-end d-flex flex-column gap-2 align-items-md-end">
            {canBid && (
              <button className="btn btn-primary rounded-3 fw-semibold" onClick={() => setShowBidForm(true)}>
                📨 Submit Proposal
              </button>
            )}
            {hasApplied && (
              <span className={`badge rounded-pill px-3 py-2 ${
                myApplication.status === 'Approved' ? 'bg-success' :
                myApplication.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
              }`}>
                Your bid: {myApplication.status}
              </span>
            )}
            {isApproved && (
              <button className="btn btn-success rounded-3 fw-semibold" onClick={() => navigate(`/freelancer/chat/${project._id}`)}>
                💬 Chat with Client
              </button>
            )}
            {canSubmitWork && (
              <button className="btn btn-warning rounded-3 fw-semibold" onClick={openWorkForm}>
                {project.revisions?.some((r) => !r.respondedAt) ? '📤 Resubmit Work' : '📤 Submit Work'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workflow stepper */}
      <WorkflowStepper status={project.status} hasFreelancer={!!project.selectedFreelancer} />

      {/* Dispute status / raise button */}
      <DisputeSection
        projectId={project._id}
        canRaise={isApproved && ['In Progress', 'Submitted'].includes(project.status)}
      />

      {/* Open revision request — what the client wants changed */}
      {isApproved &&
        project.status === 'In Progress' &&
        project.revisions?.length > 0 &&
        !project.revisions[project.revisions.length - 1]?.respondedAt && (
        <div className="alert alert-warning rounded-4 mb-4">
          <div className="d-flex align-items-start gap-2">
            <span style={{ fontSize: '1.3rem' }}>🔄</span>
            <div className="flex-grow-1">
              <strong>Revision requested by the client</strong>
              <p className="mb-1 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                {project.revisions[project.revisions.length - 1]?.note || 'No detailed note provided.'}
              </p>
              <small className="text-muted">
                Requested {new Date(project.revisions[project.revisions.length - 1]?.requestedAt).toLocaleString()}
                {' · '}Please update your work and resubmit.
              </small>
            </div>
            <button
              className="btn btn-warning rounded-3 fw-semibold flex-shrink-0"
              onClick={openWorkForm}
              disabled={actionLoading}
            >
              📤 Resubmit Work
            </button>
          </div>
        </div>
      )}

      {/* Own submission (view after submitting / after completion) */}
      {(project.status === 'Submitted' || project.status === 'Completed') && project.submission?.submittedAt && (
        <div className="mb-4">
          <SubmissionPanel submission={project.submission} title="Your Submission" />
        </div>
      )}

      {/* Project Description */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
        <h5 className="fw-bold mb-3">Project Description</h5>
        <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>

        <hr />

        <h5 className="fw-bold mb-3">Client</h5>
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', flexShrink: 0 }}
          >
            {project.client?.name?.charAt(0)}
          </div>
          <div>
            <div className="fw-bold">{project.client?.name}</div>
            <StarRating rating={project.client?.rating || 0} />
          </div>
        </div>
      </div>

      {/* Escrow transaction (read-only for freelancer) */}
      {isApproved && (
        <div className="mb-4">
          <TransactionCard transaction={transaction} role="Freelancer" />
        </div>
      )}

      {/* Reviews — leave a review for the client after completion */}
      {isApproved && project.status === 'Completed' && (
        <div className="mb-4">
          <ReviewsSection
            projectId={project._id}
            canReview
            revieweeName={project.client?.name}
            onLeaveReview={() => setShowReviewModal(true)}
            refreshKey={reviewsRefresh}
          />
        </div>
      )}

      {/* Review client modal */}
      {showReviewModal && project?.client && (
        <ReviewModal
          projectId={project._id}
          reviewedUserId={project.client?._id || project.client}
          reviewedUserName={project.client?.name || 'Client'}
          onClose={() => {
            setShowReviewModal(false);
            setReviewsRefresh((r) => r + 1);
          }}
        />
      )}

      {/* Bid Form Modal */}
      {showBidForm && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1050, overflowY: 'auto' }}
          onClick={(e) => e.target === e.currentTarget && setShowBidForm(false)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered my-4">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <h4 className="modal-title fw-bold">📨 Submit Proposal</h4>
                <button type="button" className="btn-close" onClick={() => setShowBidForm(false)} />
              </div>
              <form onSubmit={handleBidSubmit}>
                <div className="modal-body px-4 pt-3">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Proposal <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control rounded-3"
                      rows={5}
                      placeholder="Explain why you're the best fit for this project..."
                      value={bidForm.proposal}
                      onChange={(e) => setBidForm((f) => ({ ...f, proposal: e.target.value }))}
                      maxLength={3000}
                    />
                    <small className="text-muted">{bidForm.proposal.length}/3000</small>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Bid Amount (USD) <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text rounded-start-3">$</span>
                        <input
                          type="number"
                          className="form-control rounded-end-3"
                          placeholder="500"
                          value={bidForm.bidAmount}
                          onChange={(e) => setBidForm((f) => ({ ...f, bidAmount: e.target.value }))}
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Estimated Duration <span className="text-danger">*</span></label>
                      <input
                        className="form-control rounded-3"
                        placeholder="e.g. 2-3 weeks"
                        value={bidForm.estimatedDuration}
                        onChange={(e) => setBidForm((f) => ({ ...f, estimatedDuration: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-light rounded-3 px-4" onClick={() => setShowBidForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={actionLoading}>
                    {actionLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                    ) : (
                      '📨 Submit Proposal'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Work Submission Form Modal */}
      {showWorkForm && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1050, overflowY: 'auto' }}
          onClick={(e) => e.target === e.currentTarget && setShowWorkForm(false)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered my-4">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <h4 className="modal-title fw-bold">📤 Submit Completed Work</h4>
                <button type="button" className="btn-close" onClick={() => setShowWorkForm(false)} />
              </div>
              <form onSubmit={handleWorkSubmit}>
                <div className="modal-body px-4 pt-3">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Project Link <span className="text-danger">*</span></label>
                    <input
                      className="form-control rounded-3"
                      placeholder="https://github.com/... or https://your-project.com"
                      value={workForm.projectLink}
                      onChange={(e) => setWorkForm((f) => ({ ...f, projectLink: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control rounded-3"
                      rows={4}
                      placeholder="Describe what you've completed, how to use it, etc..."
                      value={workForm.description}
                      onChange={(e) => setWorkForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">File URLs (Optional)</label>
                    <input
                      className="form-control rounded-3"
                      placeholder="https://drive.google.com/... (one per line)"
                      onChange={(e) => {
                        const files = e.target.value.split('\n').filter(Boolean).map((url) => ({ url }));
                        setWorkForm((f) => ({ ...f, files }));
                      }}
                    />
                    <small className="text-muted">Enter one file URL per line</small>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-light rounded-3 px-4" onClick={() => setShowWorkForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning rounded-3 px-4 fw-semibold" disabled={actionLoading}>
                    {actionLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                    ) : (
                      '📤 Submit Work'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

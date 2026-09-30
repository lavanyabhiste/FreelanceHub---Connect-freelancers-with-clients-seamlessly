import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import FadeContent from '../../components/reactbits/FadeContent/FadeContent';

const STATUS_BADGES = {
  Pending: 'bg-warning text-dark',
  Approved: 'bg-success',
  Rejected: 'bg-danger',
};

const PROJECT_BADGES = {
  Open: 'bg-info text-dark',
  'In Progress': 'bg-primary',
  Submitted: 'bg-warning text-dark',
  Completed: 'bg-success',
  Cancelled: 'bg-secondary',
};

export default function ClientApplications() {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pg, limit: 10 };
      if (status) params.status = status;
      const res = await projectService.getClientApplications(params);
      setApplications(res.applications || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPage(res.currentPage || pg);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load applications.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">📨 Applications</h3>
          <p className="text-muted mb-0">
            {total} application{total !== 1 ? 's' : ''} received across your projects
          </p>
        </div>
        <select
          className="form-select rounded-3"
          style={{ width: 180 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <LoadingState label="Loading applications…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : applications.length === 0 ? (
        <div className="fh-card">
          <EmptyState
            icon="📭"
            title="No applications yet"
            hint="Applications will appear here once freelancers start bidding on your open projects."
            action={
              <Link to="/client/projects" className="btn btn-primary rounded-3 px-4">
                📋 Manage my projects
              </Link>
            }
          />
        </div>
      ) : (
        <FadeContent distance={20} duration={500}>
          <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Project</th>
                    <th>Freelancer</th>
                    <th>Bid</th>
                    <th>Duration</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <div className="fw-semibold small">{a.project?.title || 'Project'}</div>
                        {a.project && (
                          <span className={`badge rounded-pill small ${PROJECT_BADGES[a.project.status] || 'bg-secondary'}`}>
                            {a.project.status}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                            style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '0.78rem' }}
                          >
                            {a.freelancer?.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="small fw-semibold">{a.freelancer?.name}</div>
                            {a.freelancer?.rating > 0 && (
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                ⭐ {a.freelancer.rating} ({a.freelancer.totalReviews || 0})
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><strong>${Number(a.bidAmount).toLocaleString()}</strong></td>
                      <td><small>{a.estimatedDuration}</small></td>
                      <td><small className="text-muted">{new Date(a.createdAt).toLocaleDateString()}</small></td>
                      <td><span className={`badge rounded-pill ${STATUS_BADGES[a.status] || 'bg-secondary'}`}>{a.status}</span></td>
                      <td className="text-end">
                        <Link
                          to={`/client/projects/${a.project?._id}`}
                          className="btn btn-sm btn-outline-primary rounded-3"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeContent>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && !error && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
          <button className="btn btn-outline-primary btn-sm rounded-3" disabled={page <= 1} onClick={() => load(page - 1)}>
            ← Previous
          </button>
          <span className="small text-muted">Page {page} of {totalPages}</span>
          <button className="btn btn-outline-primary btn-sm rounded-3" disabled={page >= totalPages} onClick={() => load(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

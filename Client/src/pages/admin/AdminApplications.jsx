import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';

const BADGES = {
  Pending: 'bg-warning text-dark',
  Approved: 'bg-success',
  Rejected: 'bg-danger',
};

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getApplications({ page, limit: 20, status: status || undefined });
      setApplications(res.applications);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">📨 Application Monitor</h3>
          <p className="text-muted mb-0">{total} applications submitted</p>
        </div>
        <select className="form-select rounded-3" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : applications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div style={{ fontSize: '2.5rem' }}>📭</div>
            <p className="mt-2 mb-0">No applications found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Freelancer</th>
                  <th>Bid</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="fw-semibold small">{a.project?.title || <span className="text-muted">Deleted project</span>}</div>
                      {a.project && <span className={`badge ${a.project.status === 'Completed' ? 'bg-success' : a.project.status === 'Cancelled' ? 'bg-danger' : 'bg-light text-secondary border'} rounded-pill small`}>{a.project.status}</span>}
                    </td>
                    <td><small>{a.project?.client?.name || '—'}</small></td>
                    <td>
                      <small className="fw-semibold">{a.freelancer?.name || '—'}</small>
                      {a.freelancer?.rating != null && <div className="text-muted" style={{ fontSize: '0.72rem' }}>⭐ {a.freelancer.rating}</div>}
                    </td>
                    <td><strong>${a.bidAmount?.toLocaleString()}</strong></td>
                    <td><small>{a.estimatedDuration}</small></td>
                    <td><span className={`badge rounded-pill ${BADGES[a.status] || 'bg-secondary'}`}>{a.status}</span></td>
                    <td><small className="text-muted">{new Date(a.createdAt).toLocaleDateString()}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
          <button className="btn btn-outline-primary btn-sm rounded-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
          <span className="small text-muted">Page {page} of {totalPages}</span>
          <button className="btn btn-outline-primary btn-sm rounded-3" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';

const STATUS_BADGES = {
  Open: 'bg-info text-dark',
  'In Progress': 'bg-primary',
  Submitted: 'bg-warning text-dark',
  Completed: 'bg-success',
  Cancelled: 'bg-danger',
};

export default function AdminProjects() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getProjects({
        page, limit: 20,
        status: status || undefined,
        search: search.trim() || undefined,
      });
      setProjects(res.projects);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const t = setTimeout(loadProjects, 300);
    return () => clearTimeout(t);
  }, [loadProjects]);

  useEffect(() => { setPage(1); }, [status]);

  const handleModerate = async (project) => {
    const restoring = project.status === 'Cancelled';
    const target = restoring ? 'Open' : 'Cancelled';
    const msg = restoring
      ? `Restore "${project.title}" to Open?`
      : `Suspend/cancel "${project.title}"? The project will no longer accept applications.`;
    if (!window.confirm(msg)) return;
    setActionId(project._id);
    try {
      const res = await adminService.moderateProject(project._id, target);
      toast.success(res.message);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Permanently delete "${project.title}"? This cannot be undone.`)) return;
    setActionId(project._id);
    try {
      const res = await adminService.deleteProject(project._id);
      toast.success(res.message);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">📋 Project Moderation</h3>
        <p className="text-muted mb-0">{total} projects on the platform</p>
      </div>

      {/* Filters */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-5">
            <input
              className="form-control rounded-3"
              placeholder="🔍 Search by title or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3 col-6">
            <select className="form-select rounded-3" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-md-2 col-6">
            <button className="btn btn-outline-secondary rounded-3 w-100" onClick={loadProjects}>🔄 Refresh</button>
          </div>
        </div>
      </div>

      {/* Projects table */}
      <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div style={{ fontSize: '2.5rem' }}>📭</div>
            <p className="mt-2 mb-0">No projects match your filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Freelancer</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-end">Moderation</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {/* Plain text — admin moderation happens in-list, and there is
                          no /admin/projects/:id route to link to. */}
                      <span className="fw-semibold small">{p.title}</span>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{p.category}</div>
                    </td>
                    <td><small>{p.client?.name || '—'}</small></td>
                    <td><small>{p.selectedFreelancer?.name || <span className="text-muted">—</span>}</small></td>
                    <td><strong>${p.budget?.toLocaleString()}</strong></td>
                    <td><span className={`badge rounded-pill ${STATUS_BADGES[p.status] || 'bg-secondary'}`}>{p.status}</span></td>
                    <td><small className="text-muted">{new Date(p.createdAt).toLocaleDateString()}</small></td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1 flex-wrap">
                        {p.status !== 'Completed' && p.status !== 'In Progress' && p.status !== 'Submitted' && (
                          <button
                            className="btn btn-sm btn-outline-warning rounded-3"
                            onClick={() => handleModerate(p)}
                            disabled={actionId === p._id}
                          >
                            {p.status === 'Cancelled' ? '↩ Restore' : '⛔ Suspend'}
                          </button>
                        )}
                        {(p.status === 'Open' || p.status === 'Cancelled') && (
                          <button
                            className="btn btn-sm btn-outline-danger rounded-3"
                            onClick={() => handleDelete(p)}
                            disabled={actionId === p._id}
                          >
                            🗑 Delete
                          </button>
                        )}
                        {(p.status === 'In Progress' || p.status === 'Submitted') && (
                          <span className="badge bg-light text-secondary border rounded-pill small">
                            Active — use disputes
                          </span>
                        )}
                      </div>
                    </td>
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

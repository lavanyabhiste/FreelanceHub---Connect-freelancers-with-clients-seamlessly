import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';

export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [status, setStatus] = useState('');
  const [verified, setVerified] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page, limit: 20,
        role: role || undefined,
        status: status || undefined,
        verified: verified || undefined,
        search: search.trim() || undefined,
      });
      setUsers(res.users);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, role, status, verified, search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [role, status, verified]);

  const handleVerify = async (user) => {
    setActionId(user._id);
    try {
      const res = await adminService.verifyUser(user._id, !user.isVerified);
      toast.success(res.message);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleStatus = async (user) => {
    const deactivating = user.isActive !== false;
    const msg = deactivating
      ? `Deactivate ${user.name}? They will be logged out and blocked from the platform.`
      : `Reactivate ${user.name}?`;
    if (!window.confirm(msg)) return;
    setActionId(user._id);
    try {
      const res = await adminService.setUserStatus(user._id, !deactivating);
      toast.success(res.message);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">👥 Users</h3>
          <p className="text-muted mb-0">{total} users registered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control rounded-3"
              placeholder="🔍 Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2 col-6">
            <select className="form-select rounded-3" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              <option value="Client">Client</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="col-md-2 col-6">
            <select className="form-select rounded-3" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
          <div className="col-md-2 col-6">
            <select className="form-select rounded-3" value={verified} onChange={(e) => setVerified(e.target.value)}>
              <option value="">Any verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>
          <div className="col-md-2 col-6">
            <button className="btn btn-outline-secondary rounded-3 w-100" onClick={loadUsers}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div style={{ fontSize: '2.5rem' }}>📭</div>
            <p className="mt-2 mb-0">No users match your filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Rating</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const inactive = u.isActive === false;
                  return (
                    <tr key={u._id} className={inactive ? 'table-danger' : ''}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                            style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '0.85rem' }}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold small">{u.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${
                          u.role === 'Admin' ? 'bg-danger' : u.role === 'Client' ? 'bg-info text-dark' : 'bg-primary'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'Admin' ? (
                          <small>⭐ {u.rating || 0} ({u.totalReviews || 0})</small>
                        ) : '—'}
                      </td>
                      <td>
                        {u.isVerified
                          ? <span className="badge bg-success">✓ Verified</span>
                          : <span className="badge bg-secondary">Unverified</span>}
                      </td>
                      <td>
                        {inactive
                          ? <span className="badge bg-danger">Deactivated</span>
                          : <span className="badge bg-success">Active</span>}
                      </td>
                      <td><small className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</small></td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1 flex-wrap">
                          <button
                            className={`btn btn-sm rounded-3 ${u.isVerified ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                            onClick={() => handleVerify(u)}
                            disabled={actionId === u._id || u.role === 'Admin'}
                            title={u.isVerified ? 'Remove verification' : 'Verify user'}
                          >
                            {u.isVerified ? '↩ Unverify' : '✓ Verify'}
                          </button>
                          <button
                            className={`btn btn-sm rounded-3 ${inactive ? 'btn-success' : 'btn-outline-danger'}`}
                            onClick={() => handleStatus(u)}
                            disabled={actionId === u._id || u.role === 'Admin'}
                            title={u.role === 'Admin' ? 'Admin accounts cannot be deactivated' : (inactive ? 'Activate' : 'Deactivate')}
                          >
                            {inactive ? '✓ Activate' : '⛔ Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
          <button className="btn btn-outline-primary btn-sm rounded-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span className="small text-muted">Page {page} of {totalPages}</span>
          <button className="btn btn-outline-primary btn-sm rounded-3" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

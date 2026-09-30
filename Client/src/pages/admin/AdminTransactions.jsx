import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';

const STATUS_BADGES = {
  Pending: { cls: 'bg-warning text-dark', icon: '⏳' },
  Completed: { cls: 'bg-success', icon: '✅' },
  Failed: { cls: 'bg-danger', icon: '❌' },
  Refunded: { cls: 'bg-secondary', icon: '↩️' },
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getTransactions({ page, limit: 20, status: status || undefined });
      setTransactions(res.transactions);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setSummary(res.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">💳 Transactions</h3>
          <p className="text-muted mb-0">{total} transactions on record</p>
        </div>
        <select className="form-select rounded-3" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {/* Summary chips */}
      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">Pending</div>
              <div className="fw-bold fs-5 text-warning">{summary.pending}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">Completed</div>
              <div className="fw-bold fs-5 text-success">{summary.completed}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">Failed</div>
              <div className="fw-bold fs-5 text-danger">{summary.failed}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-3 text-center">
              <div className="text-muted small">Refunded</div>
              <div className="fw-bold fs-5 text-secondary">{summary.refunded}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div style={{ fontSize: '2.5rem' }}>💳</div>
            <p className="mt-2 mb-0">No transactions found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Reference</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Freelancer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const st = STATUS_BADGES[t.status] || STATUS_BADGES.Pending;
                  return (
                    <tr key={t._id}>
                      <td><small className="text-break">{t.paymentReference}</small></td>
                      <td><small className="fw-semibold">{t.project?.title || '—'}</small></td>
                      <td><small>{t.client?.name || '—'}</small></td>
                      <td><small>{t.freelancer?.name || '—'}</small></td>
                      <td><strong>${t.amount?.toLocaleString()}</strong></td>
                      <td><span className={`badge rounded-pill ${st.cls}`}>{st.icon} {t.status}</span></td>
                      <td><small className="text-muted">{new Date(t.createdAt).toLocaleDateString()}</small></td>
                    </tr>
                  );
                })}
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

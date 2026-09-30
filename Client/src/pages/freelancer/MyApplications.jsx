import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyApplications } from '../../slices/freelancerSlice';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function MyApplications() {
  const dispatch = useDispatch();
  const { applications, loading, total, totalPages, currentPage } = useSelector((s) => s.freelancer);
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const loadApplications = (pg = page) => {
    const params = { page: pg, limit: 10 };
    if (statusFilter !== 'All') params.status = statusFilter;
    dispatch(fetchMyApplications(params));
  };

  useEffect(() => { loadApplications(1); setPage(1); }, [statusFilter, dispatch]);

  return (
    <div className="container py-5">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-0">📨 My Applications</h2>
          <small className="text-muted">{total} total application{total !== 1 ? 's' : ''}</small>
        </div>
        <Link to="/freelancer/projects" className="btn btn-primary rounded-3 px-4 fw-semibold">
          + Find Projects
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn btn-sm rounded-pill px-3 ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : applications.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h5 className="mt-3 fw-bold">No applications found</h5>
          <p className="text-muted">Try adjusting the status filter or browse open projects.</p>
          <Link to="/freelancer/projects" className="btn btn-primary rounded-3 px-4 mx-auto" style={{ width: 'fit-content' }}>
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {applications.map((app) => (
            <div key={app._id} className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-8">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h5 className="mb-0 fw-bold">{app.project?.title}</h5>
                      <span className={`badge rounded-pill ${
                        app.status === 'Approved' ? 'bg-success' :
                        app.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                      }`}>{app.status}</span>
                    </div>
                    <p className="text-muted small mb-2 text-truncate" style={{ maxWidth: 480 }}>
                      {app.proposal}
                    </p>
                    <div className="d-flex flex-wrap gap-3 small text-muted">
                      <span>💰 Bid: <strong>${app.bidAmount}</strong></span>
                      <span>⏱ {app.estimatedDuration}</span>
                      <span>📅 {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="d-flex flex-wrap justify-content-md-end gap-2">
                      <Link
                        to={`/freelancer/projects/${app.project?._id}`}
                        className="btn btn-sm btn-outline-primary rounded-3"
                      >
                        View Project
                      </Link>
                      {app.status === 'Approved' && (
                        <Link
                          to={`/freelancer/chat/${app.project?._id}`}
                          className="btn btn-sm btn-success rounded-3"
                        >
                          💬 Chat
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => { setPage(pg); loadApplications(pg); }}
              className={`btn btn-sm rounded-3 ${currentPage === pg ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              {pg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

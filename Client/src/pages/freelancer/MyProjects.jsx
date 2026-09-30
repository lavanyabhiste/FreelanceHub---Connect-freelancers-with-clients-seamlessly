import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyFreelancerProjects } from '../../slices/freelancerSlice';
import StatusBadge from '../../components/StatusBadge';

const STATUS_FILTERS = ['All', 'In Progress', 'Submitted', 'Completed'];

export default function MyProjects() {
  const dispatch = useDispatch();
  const { myProjects, loading, total, totalPages, currentPage } = useSelector((s) => s.freelancer);
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const loadProjects = (pg = page) => {
    const params = { page: pg, limit: 10 };
    if (statusFilter !== 'All') params.status = statusFilter;
    dispatch(fetchMyFreelancerProjects(params));
  };

  useEffect(() => { loadProjects(1); setPage(1); }, [statusFilter, dispatch]);

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h2 className="fw-bold mb-0">💼 My Projects</h2>
        <small className="text-muted">{total} project{total !== 1 ? 's' : ''} you're working on</small>
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
      ) : myProjects.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>💼</div>
          <h5 className="mt-3 fw-bold">No projects yet</h5>
          <p className="text-muted">Browse open projects and submit proposals to get started!</p>
          <Link to="/freelancer/projects" className="btn btn-primary rounded-3 px-4 mx-auto" style={{ width: 'fit-content' }}>
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {myProjects.map((proj) => (
            <div key={proj._id} className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-8">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h5 className="mb-0 fw-bold">{proj.title}</h5>
                      <StatusBadge status={proj.status} />
                    </div>
                    <p className="text-muted small mb-2 text-truncate" style={{ maxWidth: 480 }}>
                      {proj.description}
                    </p>
                    <div className="d-flex flex-wrap gap-3 small text-muted">
                      <span>💰 ${proj.budget}</span>
                      <span>⏱ {proj.duration}</span>
                      <span>📂 {proj.category}</span>
                      {proj.deadline && (
                        <span>📅 {new Date(proj.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '0.7rem' }}
                      >
                        {proj.client?.name?.charAt(0)}
                      </div>
                      <small className="text-muted">Client: {proj.client?.name}</small>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="d-flex flex-wrap justify-content-md-end gap-2">
                      <Link
                        to={`/freelancer/projects/${proj._id}`}
                        className="btn btn-sm btn-outline-primary rounded-3"
                      >
                        View Details
                      </Link>
                      {(proj.status === 'In Progress' || proj.status === 'Submitted') && (
                        <Link
                          to={`/freelancer/chat/${proj._id}`}
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
              onClick={() => { setPage(pg); loadProjects(pg); }}
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

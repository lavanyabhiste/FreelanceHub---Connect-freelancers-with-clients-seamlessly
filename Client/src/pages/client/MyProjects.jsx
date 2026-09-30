import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { fetchMyProjects, deleteProject } from '../../slices/projectSlice';
import StatusBadge from '../../components/StatusBadge';
import ProjectFormModal from '../../components/ProjectFormModal';
import { toast } from 'react-toastify';

const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Submitted', 'Completed', 'Cancelled'];

export default function MyProjects() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { projects, loading, total, totalPages, currentPage } = useSelector((s) => s.projects);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [page, setPage] = useState(1);

  const loadProjects = (pg = page) => {
    const params = { page: pg, limit: 8 };
    if (statusFilter !== 'All') params.status = statusFilter;
    dispatch(fetchMyProjects(params));
  };

  useEffect(() => { loadProjects(1); setPage(1); }, [statusFilter, dispatch]);

  // Landing on /client/projects/new opens the create modal directly
  useEffect(() => {
    if (location.pathname.endsWith('/projects/new')) openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this project?')) return;
    const res = await dispatch(deleteProject(id));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Project cancelled.');
    else toast.error(res.payload);
  };

  const openEdit = (proj) => { setEditProject(proj); setShowModal(true); };
  const openCreate = () => { setEditProject(null); setShowModal(true); };

  return (
    <div className="container py-5">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-0">📋 My Projects</h2>
          <small className="text-muted">{total} total project{total !== 1 ? 's' : ''}</small>
        </div>
        <button className="btn btn-primary rounded-3 px-4 fw-semibold" onClick={openCreate}>
          + Post New Project
        </button>
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

      {/* Projects Table */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : projects.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h5 className="mt-3 fw-bold">No projects found</h5>
          <p className="text-muted">Try adjusting the status filter or post a new project.</p>
          <button className="btn btn-primary rounded-3 px-4 mx-auto" style={{ width: 'fit-content' }} onClick={openCreate}>
            Post a Project
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {projects.map((proj) => (
            <div key={proj._id} className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-6">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h5 className="mb-0 fw-bold">{proj.title}</h5>
                      <StatusBadge status={proj.status} />
                    </div>
                    <p className="text-muted small mb-2 text-truncate" style={{ maxWidth: 480 }}>
                      {proj.description}
                    </p>
                    <div className="d-flex flex-wrap gap-3 small text-muted">
                      <span>📂 {proj.category}</span>
                      <span>💰 ${proj.budget}</span>
                      <span>⏱ {proj.duration}</span>
                      {proj.deadline && (
                        <span>📅 {new Date(proj.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                    {proj.requiredSkills?.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-1">
                        {proj.requiredSkills.slice(0, 4).map((sk) => (
                          <span key={sk} className="badge bg-light text-secondary border rounded-pill small">{sk}</span>
                        ))}
                        {proj.requiredSkills.length > 4 && (
                          <span className="badge bg-light text-secondary border rounded-pill small">+{proj.requiredSkills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="d-flex flex-wrap justify-content-md-end gap-2">
                      <Link
                        to={`/client/projects/${proj._id}`}
                        className="btn btn-sm btn-outline-primary rounded-3"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/client/projects/${proj._id}/applications`}
                        className="btn btn-sm btn-primary rounded-3"
                      >
                        📨 Bids
                      </Link>
                      {proj.status === 'Open' && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-3"
                            onClick={() => openEdit(proj)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger rounded-3"
                            onClick={() => handleCancel(proj._id)}
                          >
                            Cancel
                          </button>
                        </>
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

      {showModal && (
        <ProjectFormModal
          project={editProject}
          onClose={() => setShowModal(false)}
          onSuccess={() => loadProjects(page)}
        />
      )}
    </div>
  );
}

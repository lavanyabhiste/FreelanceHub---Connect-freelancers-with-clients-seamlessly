import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAllProjects } from '../../slices/projectSlice';
import { toast } from 'react-toastify';

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Content Writing', 'SEO / Digital Marketing', 'Video Editing', 'Data Science',
  'DevOps / Cloud', 'Cybersecurity', 'Translation', 'Virtual Assistant', 'Other',
];

export default function BrowseProjects() {
  const dispatch = useDispatch();
  const { projects, loading, total, totalPages, currentPage } = useSelector((s) => s.projects);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [page, setPage] = useState(1);

  const loadProjects = (pg = 1) => {
    const params = { page: pg, limit: 9 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (skill) params.skill = skill;
    if (minBudget) params.minBudget = minBudget;
    if (maxBudget) params.maxBudget = maxBudget;
    dispatch(fetchAllProjects(params));
  };

  useEffect(() => { loadProjects(1); setPage(1); }, [category, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadProjects(1);
    setPage(1);
  };

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">🔍 Browse Open Projects</h2>
        <p className="text-muted">{total} open project{total !== 1 ? 's' : ''} available</p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="row g-2 mb-4">
        <div className="col-12 col-md-4">
          <input
            className="form-control rounded-3"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select rounded-3" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <input
            className="form-control rounded-3"
            placeholder="Skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
        </div>
        <div className="col-6 col-md-1">
          <input
            className="form-control rounded-3"
            placeholder="Min $"
            type="number"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />
        </div>
        <div className="col-6 col-md-1">
          <input
            className="form-control rounded-3"
            placeholder="Max $"
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-1">
          <button type="submit" className="btn btn-primary rounded-3 w-100">Go</button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : projects.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <h5 className="mt-3">No projects found</h5>
          <p className="text-muted">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="row g-4">
          {projects.map((proj) => (
            <div key={proj._id} className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 rounded-4 shadow-sm h-100 p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small">
                    {proj.category}
                  </span>
                </div>
                <h5 className="fw-bold mb-2">{proj.title}</h5>
                <p className="text-muted small mb-3" style={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {proj.description}
                </p>
                <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
                  <span>💰 ${proj.budget}</span>
                  <span>⏱ {proj.duration}</span>
                  {proj.deadline && <span>📅 {new Date(proj.deadline).toLocaleDateString()}</span>}
                </div>
                {proj.requiredSkills?.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {proj.requiredSkills.slice(0, 3).map((sk) => (
                      <span key={sk} className="badge bg-light text-secondary border rounded-pill small">{sk}</span>
                    ))}
                    {proj.requiredSkills.length > 3 && (
                      <span className="badge bg-light text-secondary border rounded-pill small">+{proj.requiredSkills.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="d-flex align-items-center gap-2 mt-auto">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                    style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '0.8rem' }}
                  >
                    {proj.client?.name?.charAt(0)}
                  </div>
                  <small className="text-muted">{proj.client?.name}</small>
                </div>
                <Link
                  to={`/freelancer/projects/${proj._id}`}
                  className="btn btn-primary rounded-3 btn-sm w-100 mt-3"
                >
                  View & Bid →
                </Link>
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

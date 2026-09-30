import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import useAuth from '../../hooks/useAuth';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import FadeContent from '../../components/reactbits/FadeContent/FadeContent';

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Content Writing', 'SEO / Digital Marketing', 'Video Editing', 'Data Science',
  'DevOps / Cloud', 'Cybersecurity', 'Translation', 'Virtual Assistant', 'Other',
];

export default function BrowseProjects() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const loadProjects = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pg, limit: 9 };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (skill.trim()) params.skill = skill.trim();
      if (minBudget) params.minBudget = minBudget;
      if (maxBudget) params.maxBudget = maxBudget;

      const res = await projectService.getAllProjects(params);
      setProjects(res.projects || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPage(res.currentPage || pg);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load projects. Is the server running?');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, skill, minBudget, maxBudget]);

  // Reload when filters change (page resets to 1)
  useEffect(() => {
    const t = setTimeout(() => loadProjects(1), 300);
    return () => clearTimeout(t);
  }, [loadProjects]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadProjects(1);
  };

  const detailPath = (id) => {
    if (!isAuthenticated) return '/login';
    if (role === 'Client') return `/client/projects/${id}`;
    if (role === 'Freelancer') return `/freelancer/projects/${id}`;
    return '/admin/projects';
  };

  const ctaLabel = !isAuthenticated ? '🔒 Login to view details' : role === 'Client' ? 'View Project →' : 'View & Bid →';

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="fh-chip mb-2">🌍 {total} open project{total !== 1 ? 's' : ''} worldwide</span>
        <h2 className="fw-bold fh-section-title mb-1">Browse Open Projects</h2>
        <div className="fh-title-accent" />
        <p className="text-muted" style={{ maxWidth: 640, margin: '0.75rem auto 0' }}>
          Discover freelance opportunities — sign in to apply, bid, and start working with
          clients on FreelanceHub.
        </p>
      </div>

      {/* Search & filters */}
      <form onSubmit={handleSearch} className="fh-card p-3 p-md-4 mb-4">
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input
              className="fh-search"
              placeholder="Search title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
            />
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select rounded-3" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
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
              aria-label="Skill"
            />
          </div>
          <div className="col-6 col-md-1">
            <input
              className="form-control rounded-3"
              placeholder="Min $"
              type="number"
              min="0"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              aria-label="Minimum budget"
            />
          </div>
          <div className="col-6 col-md-1">
            <input
              className="form-control rounded-3"
              placeholder="Max $"
              type="number"
              min="0"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              aria-label="Maximum budget"
            />
          </div>
          <div className="col-12 col-md-1">
            <button type="submit" className="btn btn-primary rounded-3 w-100 fw-semibold">Go</button>
          </div>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <LoadingState label="Fetching open projects…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadProjects(page)} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No projects match your filters"
          hint="Try broadening your search or clearing filters."
          action={
            <button
              className="btn btn-outline-primary rounded-3 px-4"
              onClick={() => { setSearch(''); setCategory(''); setSkill(''); setMinBudget(''); setMaxBudget(''); }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="row g-4">
          {projects.map((proj, idx) => (
            <div key={proj._id} className="col-12 col-md-6 col-lg-4">
              <FadeContent distance={30} duration={600} delay={(idx % 3) * 80} threshold={0.05} style={{ height: '100%' }}>
                <div className="fh-card fh-card-hover h-100 p-4 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <span className="fh-chip">{proj.category}</span>
                    <span className="badge bg-success-subtle text-success border-0 rounded-pill small">
                      ● Open
                    </span>
                  </div>
                  <h5 className="fw-bold mb-2">{proj.title}</h5>
                  <p
                    className="text-muted small mb-3"
                    style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {proj.description}
                  </p>

                  <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
                    <span>💰 <strong>${Number(proj.budget).toLocaleString()}</strong></span>
                    <span>⏱ {proj.duration}</span>
                    {proj.deadline && <span>📅 {new Date(proj.deadline).toLocaleDateString()}</span>}
                  </div>

                  {proj.requiredSkills?.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {proj.requiredSkills.slice(0, 3).map((sk) => (
                        <span key={sk} className="badge bg-light text-secondary border rounded-pill small">{sk}</span>
                      ))}
                      {proj.requiredSkills.length > 3 && (
                        <span className="badge bg-light text-secondary border rounded-pill small">
                          +{proj.requiredSkills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="d-flex align-items-center gap-2 mt-auto pt-2 border-top">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '0.8rem' }}
                    >
                      {proj.client?.name?.charAt(0)}
                    </div>
                    <small className="text-muted">
                      {proj.client?.name}
                      {proj.client?.rating > 0 && <span> · ⭐ {proj.client.rating}</span>}
                    </small>
                  </div>

                  <button
                    className="btn btn-primary rounded-3 btn-sm w-100 mt-3 fw-semibold"
                    onClick={() => navigate(detailPath(proj._id))}
                  >
                    {ctaLabel}
                  </button>
                </div>
              </FadeContent>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && !error && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
          <button
            className="btn btn-outline-primary btn-sm rounded-3"
            disabled={page <= 1}
            onClick={() => loadProjects(page - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => loadProjects(pg)}
              className={`btn btn-sm rounded-3 ${page === pg ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              {pg}
            </button>
          ))}
          <button
            className="btn btn-outline-primary btn-sm rounded-3"
            disabled={page >= totalPages}
            onClick={() => loadProjects(page + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Guest CTA */}
      {!isAuthenticated && !loading && !error && (
        <div className="fh-card p-4 mt-4 text-center">
          <p className="mb-2 fw-semibold">Want to bid on projects or hire talent?</p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <button className="btn btn-primary rounded-3 px-4" onClick={() => navigate('/register')}>
              Join Free
            </button>
            <button className="btn btn-outline-dark rounded-3 px-4" onClick={() => navigate('/login')}>
              Log In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

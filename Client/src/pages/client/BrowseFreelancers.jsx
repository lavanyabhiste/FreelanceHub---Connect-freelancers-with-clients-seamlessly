import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/projectService';
import StarRating from '../../components/StarRating';

export default function BrowseFreelancers() {
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 9 };
      if (skill) params.skill = skill;
      if (search) params.search = search;
      const data = await userService.getFreelancers(params);
      setFreelancers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); setPage(1); }, [skill]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1); setPage(1);
  };

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">🔍 Browse Freelancers</h2>
        <p className="text-muted">{total} freelancer{total !== 1 ? 's' : ''} available</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="row g-2 mb-4">
        <div className="col-12 col-md-6">
          <input
            className="form-control rounded-3"
            placeholder="Search by name, skill, or bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control rounded-3"
            placeholder="Filter by skill (e.g. React)"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <button type="submit" className="btn btn-primary rounded-3 w-100">Search</button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : freelancers.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <h5 className="mt-3">No freelancers found</h5>
          <p className="text-muted">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="row g-4">
          {freelancers.map((fl) => (
            <div key={fl._id} className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 rounded-4 shadow-sm h-100 p-4 freelancer-card">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                    style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '1.2rem' }}
                  >
                    {fl.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h6 className="mb-0 fw-bold text-truncate">{fl.name}</h6>
                    <StarRating rating={fl.rating || 0} />
                    <small className="text-muted">{fl.totalReviews} review{fl.totalReviews !== 1 ? 's' : ''}</small>
                  </div>
                </div>

                {fl.bio && (
                  <p className="text-muted small mb-3" style={{
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {fl.bio}
                  </p>
                )}

                {fl.skills?.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {fl.skills.slice(0, 4).map((sk) => (
                      <span key={sk} className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small">{sk}</span>
                    ))}
                    {fl.skills.length > 4 && (
                      <span className="badge bg-light text-secondary border rounded-pill small">+{fl.skills.length - 4}</span>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-outline-primary rounded-3 btn-sm mt-auto"
                  onClick={() => navigate(`/client/freelancers/${fl._id}`)}
                >
                  View Profile →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => { setPage(pg); load(pg); }}
              className={`btn btn-sm rounded-3 ${page === pg ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              {pg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

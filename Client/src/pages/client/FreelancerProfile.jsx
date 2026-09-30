import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService, reviewService } from '../../services/projectService';
import StarRating from '../../components/StarRating';

export default function FreelancerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, reviewRes] = await Promise.all([
          userService.getFreelancerProfile(id),
          reviewService.getUserReviews(id),
        ]);
        setFreelancer(userRes.user);
        setReviews(reviewRes.reviews);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  if (!freelancer) return <div className="container py-5 text-center"><h5>Freelancer not found.</h5></div>;

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <button className="btn btn-outline-secondary btn-sm rounded-3 mb-4" onClick={() => navigate(-1)}>← Back</button>

      {/* Profile Header */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
        <div className="d-flex align-items-start gap-4 flex-wrap">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '2rem' }}
          >
            {freelancer.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow-1">
            <h2 className="fw-bold mb-1">{freelancer.name}</h2>
            <div className="mb-1"><StarRating rating={freelancer.rating || 0} size="lg" /></div>
            <small className="text-muted">{freelancer.totalReviews} review{freelancer.totalReviews !== 1 ? 's' : ''}</small>
            {freelancer.isVerified && (
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill ms-2 small">✔ Verified</span>
            )}
          </div>
        </div>

        {freelancer.bio && (
          <div className="mt-3">
            <h6 className="fw-semibold">About</h6>
            <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{freelancer.bio}</p>
          </div>
        )}

        {freelancer.experience && (
          <div className="mt-2">
            <h6 className="fw-semibold">Experience</h6>
            <p className="text-muted">{freelancer.experience}</p>
          </div>
        )}

        {freelancer.skills?.length > 0 && (
          <div className="mt-2">
            <h6 className="fw-semibold">Skills</h6>
            <div className="d-flex flex-wrap gap-2">
              {freelancer.skills.map((sk) => (
                <span key={sk} className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1">{sk}</span>
              ))}
            </div>
          </div>
        )}

        {freelancer.portfolio?.length > 0 && (
          <div className="mt-3">
            <h6 className="fw-semibold">Portfolio</h6>
            <div className="row g-2">
              {freelancer.portfolio.map((p, i) => (
                <div key={i} className="col-12 col-md-6">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="card p-3 border rounded-3 text-decoration-none d-block hover-shadow">
                    <div className="fw-semibold text-primary">{p.title}</div>
                    {p.description && <small className="text-muted">{p.description}</small>}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <h4 className="fw-bold mb-3">⭐ Reviews ({reviews.length})</h4>
      {reviews.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-4 text-center text-muted">
          No reviews yet.
        </div>
      ) : (
        <div className="row g-3">
          {reviews.map((rev) => (
            <div key={rev._id} className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                    style={{ width: 40, height: 40, background: '#4f46e5', fontSize: '1rem' }}
                  >
                    {rev.reviewer?.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="fw-semibold">{rev.reviewer?.name}</div>
                    <StarRating rating={rev.rating} />
                  </div>
                  <small className="text-muted ms-auto">{new Date(rev.createdAt).toLocaleDateString()}</small>
                </div>
                <p className="text-muted mb-0 small">{rev.comment}</p>
                {rev.project?.title && (
                  <small className="text-muted d-block mt-1">Project: <em>{rev.project.title}</em></small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

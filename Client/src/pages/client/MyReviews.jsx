import { useEffect, useState } from 'react';
import { reviewService } from '../../services/projectService';
import useAuth from '../../hooks/useAuth';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import FadeContent from '../../components/reactbits/FadeContent/FadeContent';
import SpotlightCard from '../../components/reactbits/SpotlightCard/SpotlightCard';
import CountUp from '../../components/reactbits/CountUp/CountUp';

function Stars({ value }) {
  return (
    <span style={{ letterSpacing: 2 }} aria-label={`${value} out of 5 stars`}>
      <span className="text-warning">{'★'.repeat(value)}</span>
      <span style={{ color: '#cbd5e1' }}>{'★'.repeat(5 - value)}</span>
    </span>
  );
}

export default function MyReviews() {
  const { user } = useAuth();
  const userId = user?._id;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return; // wait for auth rehydration
    let cancelled = false;
    (async () => {
      try {
        const res = await reviewService.getUserReviews(userId);
        if (!cancelled) setReviews(res.reviews || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load reviews.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const avg = reviews.length
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : user?.rating || 0;

  return (
    <div className="container-fluid py-4 px-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">⭐ Reviews</h3>
        <p className="text-muted mb-0">Feedback left by freelancers after project completion</p>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <SpotlightCard className="fh-stat h-100" spotlightColor="rgba(79,70,229,0.12)">
            <div className="text-muted small mb-1">Average rating</div>
            <div className="fh-stat-value fs-4 text-warning d-flex align-items-baseline gap-1">
              <CountUp to={avg} from={0} duration={1.4} separator="," />
              <span className="fs-6">/ 5</span>
            </div>
          </SpotlightCard>
        </div>
        <div className="col-6 col-md-3">
          <SpotlightCard className="fh-stat h-100" spotlightColor="rgba(79,70,229,0.12)">
            <div className="text-muted small mb-1">Total reviews</div>
            <div className="fh-stat-value fs-4 text-primary">
              <CountUp to={reviews.length} duration={1.2} />
            </div>
          </SpotlightCard>
        </div>
        <div className="col-6 col-md-3">
          <SpotlightCard className="fh-stat h-100" spotlightColor="rgba(79,70,229,0.12)">
            <div className="text-muted small mb-1">5-star reviews</div>
            <div className="fh-stat-value fs-4 text-success">
              <CountUp to={reviews.filter((r) => r.rating === 5).length} duration={1.2} />
            </div>
          </SpotlightCard>
        </div>
        <div className="col-6 col-md-3">
          <SpotlightCard className="fh-stat h-100" spotlightColor="rgba(79,70,229,0.12)">
            <div className="text-muted small mb-1">Your profile rating</div>
            <div className="fh-stat-value fs-4">
              <CountUp to={user?.rating || 0} duration={1.4} />
              <span className="fs-6 text-muted"> ⭐</span>
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <LoadingState label="Loading reviews…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : reviews.length === 0 ? (
        <div className="fh-card">
          <EmptyState
            icon="⭐"
            title="No reviews yet"
            hint="Reviews appear here once freelancers complete projects you posted and rate their experience working with you."
          />
        </div>
      ) : (
        <div className="row g-3">
          {reviews.map((r, idx) => (
            <div className="col-12 col-md-6" key={r._id}>
              <FadeContent distance={24} duration={550} delay={(idx % 2) * 90} threshold={0.05} style={{ height: '100%' }}>
                <div className="fh-card fh-card-hover p-4 h-100">
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '0.9rem' }}
                      >
                        {r.reviewer?.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-semibold small">{r.reviewer?.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {r.reviewer?.role} · {r.project?.title ? `“${r.project.title}”` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="small"><Stars value={r.rating} /></span>
                  </div>
                  <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                    “{r.comment}”
                  </p>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </FadeContent>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { reviewService } from '../services/projectService';
import StarRating from './StarRating';

/**
 * Lists reviews left on a project + optional "Leave Review" button.
 *
 * @param {object} props
 * @param {string} props.projectId
 * @param {boolean} props.canReview   Whether current user may leave a review (project Completed)
 * @param {string} props.revieweeName Name shown on the leave-review button
 * @param {Function} props.onLeaveReview  Called when user clicks "Leave Review"
 */
export default function ReviewsSection({ projectId, canReview, revieweeName, onLeaveReview, refreshKey }) {
  const [reviews, setReviews] = useState([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await reviewService.getProjectReviews(projectId);
        if (!cancelled) {
          setReviews(res.reviews || []);
          setHasReviewed(!!res.hasReviewed);
        }
      } catch {
        // participants-only endpoint — silently ignore if not authorized
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, refreshKey]);

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-3">
        <h5 className="fw-bold mb-0">⭐ Reviews</h5>
        {canReview && !hasReviewed && (
          <button className="btn btn-primary rounded-3 fw-semibold" onClick={onLeaveReview}>
            ⭐ Leave Review{revieweeName ? ` for ${revieweeName}` : ''}
          </button>
        )}
        {hasReviewed && (
          <span className="badge bg-success rounded-pill px-3 py-2">✓ You reviewed this project</span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-muted mb-0">No reviews yet for this project.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {reviews.map((r) => (
            <div key={r._id} className="border rounded-3 p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                  style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '0.85rem' }}
                >
                  {r.reviewer?.name?.charAt(0)}
                </div>
                <div>
                  <div className="fw-semibold small">{r.reviewer?.name}</div>
                  <StarRating rating={r.rating} />
                </div>
                <small className="text-muted ms-auto">
                  {new Date(r.createdAt).toLocaleDateString()}
                </small>
              </div>
              <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-wrap' }}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

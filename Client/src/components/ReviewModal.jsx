import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reviewService } from '../services/projectService';
import { toast } from 'react-toastify';

export default function ReviewModal({ projectId, reviewedUserId, reviewedUserName, onClose }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a star rating.');
    if (!comment.trim()) return toast.error('Please write a review comment.');
    setLoading(true);
    try {
      await reviewService.createReview({ projectId, reviewedUserId, rating, comment });
      toast.success('Review submitted successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1050 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg">
          <div className="modal-header border-0 px-4 pt-4">
            <h5 className="modal-title fw-bold">⭐ Review {reviewedUserName}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4">
              <p className="text-muted small mb-3">Share your experience working with this person on this project.</p>

              {/* Star selector */}
              <div className="mb-3 text-center">
                <div className="d-flex justify-content-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: star <= (hover || rating) ? '#f5a623' : '#d0d0d0',
                        transition: 'color 0.15s',
                      }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <small className="text-muted">
                  {rating === 0 ? 'Click to rate' :
                   rating === 1 ? 'Poor' : rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                </small>
              </div>

              <textarea
                className="form-control rounded-3"
                rows={4}
                placeholder="Write your review here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
              />
              <small className="text-muted">{comment.length}/2000</small>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button type="button" className="btn btn-light rounded-3" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : '⭐ Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFreelancerProfile } from '../../slices/freelancerSlice';
import StarRating from '../../components/StarRating';
import { toast } from 'react-toastify';

export default function FreelancerProfile() {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((s) => s.auth);
  const { profileLoading } = useSelector((s) => s.freelancer);

  const [form, setForm] = useState({
    name: '',
    bio: '',
    skills: '',
    experience: '',
    portfolio: [],
  });

  const [portfolioItem, setPortfolioItem] = useState({ title: '', url: '', description: '' });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
        experience: user.experience || '',
        portfolio: user.portfolio || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleAddPortfolio = () => {
    if (!portfolioItem.title.trim() || !portfolioItem.url.trim()) {
      toast.error('Portfolio title and URL are required.');
      return;
    }
    setForm((f) => ({
      ...f,
      portfolio: [...f.portfolio, { ...portfolioItem }],
    }));
    setPortfolioItem({ title: '', url: '', description: '' });
  };

  const handleRemovePortfolio = (index) => {
    setForm((f) => ({
      ...f,
      portfolio: f.portfolio.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      bio: form.bio,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      experience: form.experience,
      portfolio: form.portfolio,
    };
    const res = await dispatch(updateFreelancerProfile(payload));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(res.payload || 'Failed to update profile.');
    }
  };

  if (authLoading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <h2 className="fw-bold mb-4">👤 My Profile</h2>

      {/* Profile Card */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', fontSize: '2rem' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="fw-bold mb-1">{user?.name}</h4>
            <div className="mb-1"><StarRating rating={user?.rating || 0} size="lg" /></div>
            <small className="text-muted">{user?.totalReviews} review{user?.totalReviews !== 1 ? 's' : ''}</small>
            {user?.isVerified && (
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill ms-2 small">✔ Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-3">Basic Information</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-control rounded-3"
                placeholder="Your name"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Email</label>
              <input
                value={user?.email}
                className="form-control rounded-3"
                disabled
              />
              <small className="text-muted">Email cannot be changed</small>
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="form-control rounded-3"
                rows={3}
                placeholder="Tell clients about yourself..."
                maxLength={1000}
              />
              <small className="text-muted">{form.bio.length}/1000</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Skills</label>
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                className="form-control rounded-3"
                placeholder="React, Node.js, MongoDB (comma-separated)"
              />
              <small className="text-muted">Separate skills with commas</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Experience</label>
              <input
                name="experience"
                value={form.experience}
                onChange={handleChange}
                className="form-control rounded-3"
                placeholder="e.g. 5 years in web development"
              />
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-3">Portfolio</h5>

          {form.portfolio.length > 0 && (
            <div className="row g-2 mb-3">
              {form.portfolio.map((item, idx) => (
                <div key={idx} className="col-12 col-md-6">
                  <div className="card p-3 border rounded-3">
                    <div className="d-flex align-items-start justify-content-between">
                      <div>
                        <div className="fw-semibold text-primary">{item.title}</div>
                        <small className="text-muted">{item.description}</small>
                        <br />
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="small">
                          {item.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-3"
                        onClick={() => handleRemovePortfolio(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control rounded-3"
                placeholder="Project title"
                value={portfolioItem.title}
                onChange={(e) => setPortfolioItem((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control rounded-3"
                placeholder="URL (https://...)"
                value={portfolioItem.url}
                onChange={(e) => setPortfolioItem((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control rounded-3"
                placeholder="Description"
                value={portfolioItem.description}
                onChange={(e) => setPortfolioItem((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-outline-primary rounded-3 w-100"
                onClick={handleAddPortfolio}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary rounded-3 px-4 fw-semibold"
          disabled={profileLoading}
        >
          {profileLoading ? (
            <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
          ) : (
            '💾 Save Profile'
          )}
        </button>
      </form>
    </div>
  );
}

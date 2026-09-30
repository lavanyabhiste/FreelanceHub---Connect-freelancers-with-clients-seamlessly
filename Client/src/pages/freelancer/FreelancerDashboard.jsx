import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFreelancerStats, fetchMyApplications } from '../../slices/freelancerSlice';
import StarRating from '../../components/StarRating';
import CountUp from '../../components/reactbits/CountUp/CountUp';
import FadeContent from '../../components/reactbits/FadeContent/FadeContent';

const StatCard = ({ label, value, icon, color }) => (
  <div className="col-6 col-md-4 col-lg-3">
    <FadeContent distance={24} duration={550} threshold={0.05} style={{ height: '100%' }}>
      <div className={`card border-0 rounded-4 h-100 text-center p-3 shadow-sm bg-${color}-subtle`}>
        <div style={{ fontSize: '1.8rem' }}>{icon}</div>
        <div className={`fw-bold text-${color} display-6 my-1`}>
          {value != null ? <CountUp to={Number(value)} duration={1.1} /> : '–'}
        </div>
        <small className="text-muted fw-medium">{label}</small>
      </div>
    </FadeContent>
  </div>
);

export default function FreelancerDashboard() {
  const dispatch = useDispatch();
  const { stats, applications, loading } = useSelector((s) => s.freelancer);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchFreelancerStats());
    dispatch(fetchMyApplications({ limit: 5 }));
  }, [dispatch]);

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-5">
        <div>
          <h1 className="fw-bold mb-1">👋 Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted mb-0">Here's an overview of your freelance activity.</p>
        </div>
        <Link to="/freelancer/projects" className="btn btn-primary rounded-3 px-4 fw-semibold">
          🔍 Browse Projects
        </Link>
      </div>

      {/* Stats */}
      {loading && !stats ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="row g-3 mb-5">
          <StatCard label="Total Bids" value={stats?.totalApplications} icon="📨" color="primary" />
          <StatCard label="Pending" value={stats?.pendingApplications} icon="⏳" color="warning" />
          <StatCard label="Approved" value={stats?.approvedApplications} icon="✅" color="success" />
          <StatCard label="Rejected" value={stats?.rejectedApplications} icon="❌" color="danger" />
          <StatCard label="Active Projects" value={stats?.activeProjects} icon="💼" color="info" />
          <StatCard label="Submitted" value={stats?.submittedProjects} icon="📤" color="primary" />
          <StatCard label="Completed" value={stats?.completedProjects} icon="🏆" color="success" />
          <StatCard label="Rating" value={stats?.rating} icon="⭐" color="warning" />
        </div>
      )}

      {/* Recent Applications */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">📨 Recent Applications</h4>
        <Link to="/freelancer/applications" className="btn btn-sm btn-outline-primary rounded-3">
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
      ) : applications.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h5 className="mt-3 fw-bold">No applications yet</h5>
          <p className="text-muted">Browse open projects and submit your first proposal!</p>
          <Link to="/freelancer/projects" className="btn btn-primary rounded-3 px-4 mx-auto" style={{ width: 'fit-content' }}>
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {applications.map((app) => (
            <div key={app._id} className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4 d-flex flex-md-row align-items-start align-items-md-center gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <h5 className="mb-0 fw-bold text-dark">{app.project?.title}</h5>
                    <span className={`badge rounded-pill ${
                      app.status === 'Approved' ? 'bg-success' :
                      app.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                    }`}>{app.status}</span>
                  </div>
                  <p className="text-muted small mb-2 text-truncate">{app.proposal}</p>
                  <div className="d-flex flex-wrap gap-3 small text-muted">
                    <span>💰 Bid: ${app.bidAmount}</span>
                    <span>⏱ {app.estimatedDuration}</span>
                    <span>📅 {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <Link to={`/freelancer/projects/${app.project?._id}`} className="btn btn-sm btn-outline-primary rounded-3">
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

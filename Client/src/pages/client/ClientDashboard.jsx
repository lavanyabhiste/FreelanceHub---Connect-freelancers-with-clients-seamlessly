import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchClientStats, fetchMyProjects } from '../../slices/projectSlice';
import StatusBadge from '../../components/StatusBadge';
import CountUp from '../../components/reactbits/CountUp/CountUp';
import FadeContent from '../../components/reactbits/FadeContent/FadeContent';

const StatCard = ({ label, value, icon, color }) => (
  <div className="col-6 col-md-4 col-lg-2">
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

export default function ClientDashboard() {
  const dispatch = useDispatch();
  const { stats, projects, loading } = useSelector((s) => s.projects);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchClientStats());
    dispatch(fetchMyProjects({ limit: 5 }));
  }, [dispatch]);

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-5">
        <div>
          <h1 className="fw-bold mb-1">👋 Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted mb-0">Here's an overview of your projects and hiring activity.</p>
        </div>
        <Link to="/client/projects/new" className="btn btn-primary rounded-3 px-4 fw-semibold">
          + Post New Project
        </Link>
      </div>

      {/* Stats */}
      {loading && !stats ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="row g-3 mb-5">
          <StatCard label="Total Projects" value={stats?.totalProjects} icon="📁" color="primary" />
          <StatCard label="Open" value={stats?.openProjects} icon="🟢" color="success" />
          <StatCard label="In Progress" value={stats?.inProgressProjects} icon="🔵" color="info" />
          <StatCard label="Completed" value={stats?.completedProjects} icon="✅" color="success" />
          <StatCard label="Cancelled" value={stats?.cancelledProjects} icon="⛔" color="secondary" />
          <StatCard label="Pending Bids" value={stats?.pendingApplications} icon="📨" color="warning" />
        </div>
      )}

      {/* Recent Projects */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">📋 Recent Projects</h4>
        <Link to="/client/projects" className="btn btn-sm btn-outline-primary rounded-3">
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
      ) : projects.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h5 className="mt-3 fw-bold">No projects yet</h5>
          <p className="text-muted">Post your first project and start hiring top freelancers.</p>
          <Link to="/client/projects/new" className="btn btn-primary rounded-3 px-4 mx-auto" style={{ width: 'fit-content' }}>
            Post a Project
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {projects.map((proj) => (
            <div key={proj._id} className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4 d-flex flex-md-row align-items-start align-items-md-center gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <h5 className="mb-0 fw-bold text-dark">{proj.title}</h5>
                    <StatusBadge status={proj.status} />
                  </div>
                  <p className="text-muted small mb-2 text-truncate">{proj.description}</p>
                  <div className="d-flex flex-wrap gap-3 small text-muted">
                    <span>💰 ${proj.budget}</span>
                    <span>⏱ {proj.duration}</span>
                    <span>📂 {proj.category}</span>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <Link to={`/client/projects/${proj._id}`} className="btn btn-sm btn-outline-primary rounded-3">
                    View
                  </Link>
                  <Link to={`/client/projects/${proj._id}/applications`} className="btn btn-sm btn-primary rounded-3">
                    Bids
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

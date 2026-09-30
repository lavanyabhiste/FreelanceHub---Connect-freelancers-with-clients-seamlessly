import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import CountUp from '../../components/reactbits/CountUp/CountUp';
import SpotlightCard from '../../components/reactbits/SpotlightCard/SpotlightCard';

const STAT_CARDS = [
  { key: 'users.total', label: 'Total Users', icon: '👥', color: '#4f46e5', to: '/admin/users' },
  { key: 'users.clients', label: 'Clients', icon: '🧑‍💼', color: '#06b6d4', to: '/admin/users?role=Client' },
  { key: 'users.freelancers', label: 'Freelancers', icon: '🧑‍💻', color: '#8b5cf6', to: '/admin/users?role=Freelancer' },
  { key: 'projects.total', label: 'Projects', icon: '📋', color: '#f59e0b', to: '/admin/projects' },
  { key: 'projects.active', label: 'Active Projects', icon: '⚙️', color: '#10b981', to: '/admin/projects?status=In Progress' },
  { key: 'projects.completed', label: 'Completed Projects', icon: '✅', color: '#22c55e', to: '/admin/projects?status=Completed' },
  { key: 'applications.total', label: 'Applications', icon: '📨', color: '#ec4899', to: '/admin/applications' },
  { key: 'transactions.total', label: 'Transactions', icon: '💳', color: '#0ea5e9', to: '/admin/transactions' },
  { key: 'disputes.pending', label: 'Pending Disputes', icon: '⚖️', color: '#ef4444', to: '/admin/disputes' },
];

const get = (obj, path) => path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminService.getStats();
        if (!cancelled) setStats(res.stats);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger rounded-4">⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">📊 Platform Overview</h3>
          <p className="text-muted mb-0">FreelanceHub platform statistics at a glance</p>
        </div>
        <span className="badge bg-light text-secondary border rounded-pill px-3 py-2">
          🔄 Live from MongoDB
        </span>
      </div>

      {/* Main statistic cards */}
      <div className="row g-3 mb-4">
        {STAT_CARDS.map(({ key, label, icon, color, to }) => (
          <div className="col-6 col-md-4 col-xl-3" key={key}>
            <Link to={to} className="text-decoration-none d-block h-100">
              <SpotlightCard
                className="fh-feature-spotlight h-100"
                spotlightColor="rgba(79,70,229,0.13)"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small">{label}</div>
                    <div className="fw-bold fs-3" style={{ color }}>
                      <CountUp to={Number(get(stats, key)) || 0} duration={1.3} />
                    </div>
                  </div>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 48, height: 48, background: `${color}1a`, fontSize: '1.4rem' }}
                  >
                    {icon}
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </div>
        ))}
      </div>

      {/* Breakdown panels */}
      <div className="row g-3">
        <div className="col-md-6 col-xl-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-3">👥 Users</h6>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Verified</span><strong>{stats.users.verified}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Active</span><strong className="text-success">{stats.users.active}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Deactivated</span><strong className="text-danger">{stats.users.inactive}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Admins</span><strong>{stats.users.admins}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-md-6 col-xl-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-3">📋 Projects</h6>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Open</span><strong>{stats.projects.open}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>In Progress</span><strong className="text-primary">{stats.projects.active}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Submitted</span><strong className="text-warning">{stats.projects.submitted}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Cancelled</span><strong className="text-danger">{stats.projects.cancelled}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-md-6 col-xl-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-3">💳 Transactions</h6>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>In Escrow (Pending)</span><strong className="text-warning">${stats.transactions.escrowed.toLocaleString()}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Released Volume</span><strong className="text-success">${stats.transactions.volume.toLocaleString()}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Failed</span><strong className="text-danger">{stats.transactions.failed}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Refunded</span><strong>{stats.transactions.refunded}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-md-6 col-xl-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-3">📨 Applications</h6>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Pending</span><strong className="text-warning">{stats.applications.pending}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Approved</span><strong className="text-success">{stats.applications.approved}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Rejected</span><strong className="text-danger">{stats.applications.rejected}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-md-6 col-xl-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-3">⚖️ Disputes</h6>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Open</span><strong className="text-danger">{stats.disputes.open}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Under Review</span><strong className="text-warning">{stats.disputes.underReview}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Resolved</span><strong className="text-success">{stats.disputes.resolved}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>Closed</span><strong>{stats.disputes.closed}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-md-6 col-xl-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
            <h6 className="fw-bold mb-3">⭐ Reviews</h6>
            <div className="display-6 fw-bold text-primary">{stats.reviews}</div>
            <p className="text-muted small mb-0 mt-2">
              Total reviews submitted across the platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

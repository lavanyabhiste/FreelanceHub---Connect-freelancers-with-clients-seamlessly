import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { LoadingState, ErrorState } from '../../components/ui/States';
import FadeContent from '../../components/reactbits/FadeContent/FadeContent';
import SpotlightCard from '../../components/reactbits/SpotlightCard/SpotlightCard';
import CountUp from '../../components/reactbits/CountUp/CountUp';

/* ── Donut chart (conic-gradient, no extra deps) ─────────────────────────── */
function Donut({ segments, size = 170, centerValue, centerLabel }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (!total) return null;

  let cursor = 0;
  const stops = segments
    .filter((seg) => seg.value > 0)
    .map((seg) => {
      const start = (cursor / total) * 360;
      cursor += seg.value;
      const end = (cursor / total) * 360;
      return `${seg.color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <div className="d-flex flex-column align-items-center">
      <div
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `conic-gradient(${stops})`,
          position: 'relative',
          boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.05)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: size * 0.26,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <strong className="fs-4 lh-1">{centerValue}</strong>
          <span className="text-muted" style={{ fontSize: '0.66rem' }}>{centerLabel}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
        {segments.map((seg) => (
          <span key={seg.label} className="d-inline-flex align-items-center gap-1 small text-muted">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: seg.color,
                display: 'inline-block',
              }}
            />
            {seg.label} ({seg.value})
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Animated horizontal bar ─────────────────────────────────────────────── */
function BarRow({ label, value, max, color, suffix = '' }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between small mb-1">
        <span className="fw-semibold">{label}</span>
        <span className="text-muted">
          {value}{suffix} <span className="fw-semibold text-dark">({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: '#eef2f7', overflow: 'hidden' }}>
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            borderRadius: 6,
            background: color,
            transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}

/* ── KPI tile ────────────────────────────────────────────────────────────── */
function Kpi({ label, value, suffix = '%', icon, color }) {
  return (
    <SpotlightCard className="fh-stat h-100" spotlightColor="rgba(79,70,229,0.12)">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <span className="text-muted small">{label}</span>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      </div>
      <div className="fh-stat-value fs-3" style={{ color }}>
        <CountUp to={value} duration={1.6} separator="," />
        <span className="fs-6">{suffix}</span>
      </div>
    </SpotlightCard>
  );
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getStats();
      setStats(res.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="container-fluid py-4 px-4"><LoadingState label="Crunching platform numbers…" /></div>;
  if (error) return <div className="container-fluid py-4 px-4"><ErrorState message={error} onRetry={load} /></div>;

  const { users, projects, applications, transactions, disputes, reviews } = stats;

  const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);
  const completionRate = pct(projects.completed, projects.total);
  const approvalRate = pct(applications.approved, applications.total);
  const verificationRate = pct(users.verified, users.total);
  const resolutionRate = pct(disputes.resolved + disputes.closed, disputes.total);
  const escrowPending = pct(transactions.pending, transactions.total);

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1">📈 Analytics</h3>
          <p className="text-muted mb-0">Platform health, distribution, and conversion metrics</p>
        </div>
        <button className="btn btn-outline-primary rounded-3 btn-sm" onClick={load}>🔄 Refresh</button>
      </div>

      {/* KPI row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <Kpi label="Completion rate" value={completionRate} icon="✅" color="#16a34a" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <Kpi label="Bid approval" value={approvalRate} icon="📨" color="#4f46e5" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <Kpi label="Verified users" value={verificationRate} icon="🪪" color="#0891b2" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <Kpi label="Disputes resolved" value={resolutionRate} icon="⚖️" color="#dc2626" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <Kpi label="Escrow pending" value={escrowPending} icon="⏳" color="#d97706" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <Kpi label="Reviews given" value={reviews} suffix="" icon="⭐" color="#ca8a04" />
        </div>
      </div>

      <div className="row g-3">
        {/* Role distribution donut */}
        <div className="col-12 col-lg-4">
          <FadeContent distance={30} duration={700}>
            <div className="fh-card p-4 h-100">
              <h6 className="fw-bold mb-3">👥 User distribution</h6>
              <Donut
                size={160}
                centerValue={users.total}
                centerLabel="USERS"
                segments={[
                  { label: 'Clients', value: users.clients, color: '#06b6d4' },
                  { label: 'Freelancers', value: users.freelancers, color: '#4f46e5' },
                  { label: 'Admins', value: users.admins, color: '#ef4444' },
                ]}
              />
            </div>
          </FadeContent>
        </div>

        {/* Project pipeline */}
        <div className="col-12 col-lg-4">
          <FadeContent distance={30} duration={700} delay={100}>
            <div className="fh-card p-4 h-100">
              <h6 className="fw-bold mb-3">📋 Project pipeline</h6>
              <BarRow label="Open" value={projects.open} max={projects.total} color="#06b6d4" />
              <BarRow label="In Progress" value={projects.active} max={projects.total} color="#4f46e5" />
              <BarRow label="Submitted" value={projects.submitted} max={projects.total} color="#d97706" />
              <BarRow label="Completed" value={projects.completed} max={projects.total} color="#16a34a" />
              <BarRow label="Cancelled" value={projects.cancelled} max={projects.total} color="#dc2626" />
              <div className="text-muted small border-top pt-2 mb-0">
                Total: <strong>{projects.total}</strong> projects
              </div>
            </div>
          </FadeContent>
        </div>

        {/* Transactions donut */}
        <div className="col-12 col-lg-4">
          <FadeContent distance={30} duration={700} delay={200}>
            <div className="fh-card p-4 h-100">
              <h6 className="fw-bold mb-3">💳 Transaction outcomes</h6>
              <Donut
                size={160}
                centerValue={transactions.total}
                centerLabel="TXNS"
                segments={[
                  { label: 'Pending', value: transactions.pending, color: '#d97706' },
                  { label: 'Completed', value: transactions.completed, color: '#16a34a' },
                  { label: 'Failed', value: transactions.failed, color: '#dc2626' },
                  { label: 'Refunded', value: transactions.refunded, color: '#64748b' },
                ]}
              />
              <div className="row text-center mt-3">
                <div className="col-6">
                  <div className="text-muted small">Released volume</div>
                  <strong className="text-success">${Number(transactions.volume).toLocaleString()}</strong>
                </div>
                <div className="col-6">
                  <div className="text-muted small">In escrow</div>
                  <strong className="text-warning">${Number(transactions.escrowed).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </FadeContent>
        </div>

        {/* Applications funnel */}
        <div className="col-12 col-md-6">
          <FadeContent distance={30} duration={700} delay={120}>
            <div className="fh-card p-4 h-100">
              <h6 className="fw-bold mb-3">📨 Application funnel</h6>
              <BarRow label="Pending" value={applications.pending} max={applications.total} color="#d97706" />
              <BarRow label="Approved" value={applications.approved} max={applications.total} color="#16a34a" />
              <BarRow label="Rejected" value={applications.rejected} max={applications.total} color="#dc2626" />
              <div className="text-muted small border-top pt-2 mb-0">
                {applications.total} total bids · approval rate{' '}
                <strong>{approvalRate}%</strong>
              </div>
            </div>
          </FadeContent>
        </div>

        {/* Disputes */}
        <div className="col-12 col-md-6">
          <FadeContent distance={30} duration={700} delay={220}>
            <div className="fh-card p-4 h-100">
              <h6 className="fw-bold mb-3">⚖️ Dispute lifecycle</h6>
              <BarRow label="Open" value={disputes.open} max={disputes.total} color="#dc2626" />
              <BarRow label="Under Review" value={disputes.underReview} max={disputes.total} color="#d97706" />
              <BarRow label="Resolved" value={disputes.resolved} max={disputes.total} color="#0891b2" />
              <BarRow label="Closed" value={disputes.closed} max={disputes.total} color="#64748b" />
              <div className="text-muted small border-top pt-2 mb-0">
                {disputes.total} total disputes · {disputes.pending} still pending
              </div>
            </div>
          </FadeContent>
        </div>

        {/* Growth / engagement summary */}
        <div className="col-12">
          <FadeContent distance={30} duration={700} delay={260}>
            <div className="fh-card p-4">
              <h6 className="fw-bold mb-3">🧭 Platform summary</h6>
              <div className="row g-3 text-center">
                <div className="col-6 col-md-3 col-xl-2">
                  <div className="fh-stat-value fs-5 text-primary">
                    <CountUp to={users.active} duration={1.4} />
                  </div>
                  <small className="text-muted">Active users</small>
                </div>
                <div className="col-6 col-md-3 col-xl-2">
                  <div className="fh-stat-value fs-5 text-danger">
                    <CountUp to={users.inactive} duration={1.4} />
                  </div>
                  <small className="text-muted">Deactivated</small>
                </div>
                <div className="col-6 col-md-3 col-xl-2">
                  <div className="fh-stat-value fs-5 text-success">
                    <CountUp to={projects.completed} duration={1.4} />
                  </div>
                  <small className="text-muted">Projects done</small>
                </div>
                <div className="col-6 col-md-3 col-xl-2">
                  <div className="fh-stat-value fs-5" style={{ color: '#0891b2' }}>
                    <CountUp to={applications.approved} duration={1.4} />
                  </div>
                  <small className="text-muted">Bids approved</small>
                </div>
                <div className="col-6 col-md-3 col-xl-2">
                  <div className="fh-stat-value fs-5 text-warning">
                    <CountUp to={transactions.pending} duration={1.4} />
                  </div>
                  <small className="text-muted">Escrow rows</small>
                </div>
                <div className="col-6 col-md-3 col-xl-2">
                  <div className="fh-stat-value fs-5 text-secondary">
                    <CountUp to={reviews} duration={1.4} />
                  </div>
                  <small className="text-muted">Reviews</small>
                </div>
              </div>
            </div>
          </FadeContent>
        </div>
      </div>
    </div>
  );
}

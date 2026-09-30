import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../slices/authSlice';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { Hub as HubIcon, Logout, Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import NotificationBell from '../components/NotificationBell';

/**
 * Shared responsive shell for Client / Freelancer / Admin layouts.
 * Desktop: sticky sidebar. Mobile: hamburger opens an offcanvas sidebar.
 *
 * @param {Array}    navItems  [{ to, label, icon }]
 * @param {string}   homeTo    brand link target
 * @param {string}   badge     role badge under the brand
 * @param {string}   sidebarBackground  CSS background for the sidebar
 */
export default function AppShell({
  navItems,
  homeTo,
  badge,
  sidebarBackground = 'linear-gradient(180deg,#1e1b4b,#312e81)',
  children,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent background scroll while the offcanvas is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await dispatch(logoutUser());
    toast.info('Logged out successfully.');
    navigate('/login');
  };

  const brand = (
    <Link to={homeTo} className="text-decoration-none text-white">
      <div className="d-flex align-items-center gap-2">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center"
          style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}
        >
          <HubIcon fontSize="small" />
        </div>
        <span className="fw-bold fs-5">
          Freelance<span style={{ color: '#06b6d4' }}>Hub</span>
        </span>
      </div>
    </Link>
  );

  const sidebar = (
    <aside
      className={`app-sidebar text-white ${open ? 'open' : ''}`}
      style={{ background: sidebarBackground }}
      aria-hidden={undefined}
    >
      {/* Brand */}
      <div className="px-4 py-4 border-bottom border-secondary d-flex align-items-center justify-content-between">
        {brand}
        <button
          className="btn btn-sm btn-outline-light rounded-3 d-lg-none p-1"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon fontSize="small" />
        </button>
      </div>

      {/* Role badge */}
      {badge && (
        <div className="px-4 pt-3">
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2">
            {badge}
          </span>
        </div>
      )}

      {/* User info */}
      <div className="px-4 py-3 border-bottom border-secondary">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mb-2"
          style={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg,#4f46e5,#06b6d4)',
            fontSize: '1.1rem',
          }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="fw-semibold small text-truncate">{user?.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(226,232,240,0.65)' }}>
          {user?.role}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-grow-1 px-3 py-3">
        {navItems.map(({ to, label, icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`d-flex align-items-center gap-2 px-3 py-2 mb-1 rounded-3 text-decoration-none sidebar-link ${
                active ? 'bg-primary text-white' : 'sidebar-link-quiet'
              }`}
            >
              <span>{icon}</span>
              <span className="small fw-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          className="btn btn-outline-danger btn-sm w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
          onClick={handleLogout}
        >
          <Logout fontSize="small" /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="app-shell">
      {/* Backdrop (mobile) */}
      <div
        className={`app-sidebar-backdrop ${open ? 'show' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {sidebar}

      <div className="app-main">
        {/* Mobile top bar */}
        <header className="app-topbar app-mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon fontSize="small" />
          </button>
          <div className="flex-grow-1">{brand}</div>
          <NotificationBell />
        </header>

        {/* Desktop top bar */}
        <div className="d-none d-lg-flex justify-content-end align-items-center bg-white border-bottom px-4 py-2">
          <NotificationBell />
        </div>

        <div className="flex-grow-1">{children}</div>
      </div>
    </div>
  );
}

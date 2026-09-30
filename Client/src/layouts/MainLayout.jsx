import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../slices/authSlice';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { Hub as HubIcon } from '@mui/icons-material';
import ClickSpark from '../components/reactbits/ClickSpark/ClickSpark';

const PUBLIC_NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/projects', label: 'Browse Projects' },
];

export default function MainLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboardPath =
    role === 'Client'
      ? '/client/dashboard'
      : role === 'Freelancer'
        ? '/freelancer/dashboard'
        : '/admin/dashboard';

  const closeAnd = (fn) => {
    setOpen(false);
    fn();
  };

  const handleLogout = async () => {
    setOpen(false);
    await dispatch(logoutUser());
    toast.info('Logged out successfully.');
    navigate('/');
  };

  return (
    <ClickSpark sparkColor="rgba(79, 70, 229, 0.85)" sparkSize={11} sparkRadius={16} duration={450}>
      <div className="d-flex flex-column min-vh-100">
        {/* Navigation */}
        <nav className="navbar navbar-expand-lg navbar-dark public-navbar py-3 sticky-top">
          <div className="container">
            <Link
              to="/"
              className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white fs-4"
              onClick={() => setOpen(false)}
            >
              <div className="brand-icon-box bg-primary text-white rounded-3 p-1 d-flex align-items-center justify-content-center">
                <HubIcon fontSize="medium" />
              </div>
              <span>
                Freelance<span style={{ color: '#22d3ee' }}>Hub</span>
              </span>
            </Link>

            <button
              className="navbar-toggler border-0 p-1"
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
              {/* Primary links */}
              <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-3 ps-lg-4">
                {PUBLIC_NAV.map(({ to, label, end }) => (
                  <li className="nav-item" key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `public-nav-link d-inline-block ${isActive ? 'active' : ''}`
                      }
                      onClick={() => closeAnd(() => {})}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Auth actions */}
              <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                {isAuthenticated ? (
                  <>
                    <span className="badge bg-secondary-subtle text-dark border-0 rounded-pill px-3 py-2 small">
                      👋 {user?.name?.split(' ')[0]}
                    </span>
                    <Link
                      to={dashboardPath}
                      className="btn btn-primary btn-sm rounded-3 px-3 fw-semibold"
                      onClick={() => setOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      className="btn btn-outline-light btn-sm rounded-3 px-3"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn btn-outline-light btn-sm rounded-3 px-3 fw-semibold"
                      onClick={() => setOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="btn btn-primary btn-sm rounded-3 px-3 fw-semibold"
                      onClick={() => setOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-grow-1 d-flex flex-column">{children}</main>

        {/* Footer */}
        <footer
          className="py-4 mt-auto text-white-50"
          style={{
            background: 'linear-gradient(90deg, #0b1120 0%, #131a3d 55%, #1e1b4b 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <span className="small">
              © {new Date().getFullYear()} FreelanceHub — Connect freelancers with clients seamlessly.
            </span>
            <span className="small">MERN · ReactBits · Bootstrap · Redux Toolkit</span>
          </div>
        </footer>
      </div>
    </ClickSpark>
  );
}

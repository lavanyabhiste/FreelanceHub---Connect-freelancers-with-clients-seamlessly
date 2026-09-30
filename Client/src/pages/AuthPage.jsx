import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser, clearError } from '../slices/authSlice';
import { toast } from 'react-toastify';
import { Hub as HubIcon } from '@mui/icons-material';
import FadeContent from '../components/reactbits/FadeContent/FadeContent';
import BlurText from '../components/reactbits/BlurText/BlurText';
import ShinyText from '../components/reactbits/ShinyText/ShinyText';

const AUTH_BENEFITS = [
  { icon: '✅', text: 'Verified freelancers & trusted clients' },
  { icon: '💬', text: 'Real-time chat on approved projects' },
  { icon: '💳', text: 'Escrow-backed payments & disputes' },
  { icon: '⭐', text: 'Two-way ratings that build reputation' },
];

export default function AuthPage({ mode = 'login' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, role } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'Freelancer' });
  const [errors, setErrors] = useState({});
  const isRegister = mode === 'register';

  useEffect(() => {
    if (isAuthenticated && role) {
      const dest = role === 'Client' ? '/client/dashboard' : role === 'Freelancer' ? '/freelancer/dashboard' : '/admin/dashboard';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (isRegister && !form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email address.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (isRegister && form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isRegister) {
      const res = await dispatch(registerUser({ name: form.name, email: form.email, password: form.password, role: form.role }));
      if (res.meta.requestStatus === 'fulfilled') toast.success(`Welcome to FreelanceHub, ${form.name}!`);
    } else {
      await dispatch(loginUser({ email: form.email, password: form.password }));
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center auth-page-bg py-4 py-md-5"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 15% 10%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 85%, rgba(6,182,212,0.25), transparent 60%), linear-gradient(160deg, #0b1120 0%, #131a3d 55%, #1e1b4b 100%)',
      }}
    >
      <div className="container">
        <div className="row align-items-center justify-content-center g-4">
          {/* Decorative brand panel (desktop) */}
          <div className="col-lg-6 d-none d-lg-block text-white">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none text-white mb-4">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}
              >
                <HubIcon />
              </div>
              <span className="fs-4 fw-bold">
                Freelance<span style={{ color: '#06b6d4' }}>Hub</span>
              </span>
            </Link>

            <div style={{ maxWidth: 520 }}>
              <h2 className="fw-bold mb-3" style={{ lineHeight: 1.25 }}>
                {isRegister ? (
                  <BlurText
                    text="Start your freelance journey today."
                    animateBy="words"
                    direction="top"
                    delay={70}
                    threshold={0.1}
                    rootMargin="0px"
                    easing={(t) => 1 - Math.pow(1 - t, 3)}
                  />
                ) : (
                  <BlurText
                    text="Great work happens when the right people meet."
                    animateBy="words"
                    direction="top"
                    delay={70}
                    threshold={0.1}
                    rootMargin="0px"
                    easing={(t) => 1 - Math.pow(1 - t, 3)}
                  />
                )}
              </h2>
              <p className="mb-4" style={{ color: 'rgba(203,213,225,0.85)' }}>
                Join a platform where clients and freelancers collaborate with confidence —
                transparent workflows, secure escrow, and real-time communication.
              </p>

              <ul className="list-unstyled d-flex flex-column gap-3">
                {AUTH_BENEFITS.map(({ icon, text }) => (
                  <li key={text} className="d-flex align-items-center gap-3">
                    <span
                      className="rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
                    >
                      {icon}
                    </span>
                    <span style={{ color: 'rgba(226,232,240,0.92)' }}>{text}</span>
                  </li>
                ))}
              </ul>

              <ShinyText
                text="Trusted by clients & freelancers on the MERN stack"
                speed={4}
                color="#a5b4fc"
                shineColor="#ffffff"
                className="small fw-semibold"
              />
            </div>
          </div>

          {/* Form card */}
          <div className="col-12 col-md-8 col-lg-5 col-xl-4">
            <FadeContent distance={40} duration={800} threshold={0.05}>
              <div className="card border-0 rounded-4 shadow-lg p-4 p-md-5" style={{ width: '100%' }}>
                {/* Brand */}
                <div className="text-center mb-4">
                  <div
                    className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}
                  >
                    <HubIcon style={{ color: 'white' }} />
                  </div>
                  <h4 className="fw-bold mb-0">
                    {isRegister ? 'Create your account' : 'Welcome back!'}
                  </h4>
                  <p className="text-muted small mt-1">
                    {isRegister ? 'Join FreelanceHub today' : 'Sign in to FreelanceHub'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {isRegister && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-medium small">Full Name</label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className={`form-control rounded-3 ${errors.name ? 'is-invalid' : ''}`}
                          placeholder="John Doe"
                          autoComplete="name"
                        />
                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium small">I want to join as</label>
                        <div className="d-flex gap-3">
                          {['Freelancer', 'Client'].map((r) => (
                            <label
                              key={r}
                              className={`flex-grow-1 text-center border rounded-3 py-2 px-3 fw-medium small ${form.role === r ? 'border-primary bg-primary-subtle text-primary' : 'text-muted'}`}
                              style={{ cursor: 'pointer' }}
                            >
                              <input
                                type="radio"
                                name="role"
                                value={r}
                                checked={form.role === r}
                                onChange={handleChange}
                                className="d-none"
                              />
                              {r === 'Freelancer' ? '💼 Freelancer' : '🏢 Client'}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-medium small">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`form-control rounded-3 ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium small">Password</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      className={`form-control rounded-3 ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>

                  {isRegister && (
                    <div className="mb-4">
                      <label className="form-label fw-medium small">Confirm Password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={`form-control rounded-3 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="••••••••"
                      />
                      {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary w-100 rounded-3 fw-semibold py-2 mb-3" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />{isRegister ? 'Creating Account...' : 'Signing In...'}</>
                    ) : (
                      isRegister ? '🚀 Create Account' : '🔐 Sign In'
                    )}
                  </button>

                  <p className="text-center text-muted small mb-0">
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <Link to={isRegister ? '/login' : '/register'} className="text-primary fw-medium text-decoration-none">
                      {isRegister ? 'Sign in' : 'Sign up'}
                    </Link>
                  </p>
                </form>
              </div>
            </FadeContent>
          </div>
        </div>
      </div>
    </div>
  );
}

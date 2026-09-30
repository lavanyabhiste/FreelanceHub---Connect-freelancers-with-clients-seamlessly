import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AppShell from './AppShell';

const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/projects', label: 'Projects', icon: '📋' },
  { to: '/admin/applications', label: 'Applications', icon: '📨' },
  { to: '/admin/transactions', label: 'Transactions', icon: '💳' },
  { to: '/admin/disputes', label: 'Disputes', icon: '⚖️' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (!isAdmin) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <AppShell
      navItems={ADMIN_NAV}
      homeTo="/admin/dashboard"
      badge="🛡️ Admin Panel"
      sidebarBackground="linear-gradient(180deg,#1e1b4b,#312e81)"
    >
      {children}
    </AppShell>
  );
}

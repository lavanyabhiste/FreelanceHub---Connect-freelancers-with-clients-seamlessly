import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AppShell from './AppShell';

const CLIENT_NAV = [
  { to: '/client/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/client/projects', label: 'My Projects', icon: '📋' },
  { to: '/client/applications', label: 'Applications', icon: '📨' },
  { to: '/client/freelancers', label: 'Browse Freelancers', icon: '👥' },
  { to: '/client/chat', label: 'Chat', icon: '💬' },
  { to: '/client/reviews', label: 'Reviews', icon: '⭐' },
];

export default function ClientLayout({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, isClient } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (!isClient) {
      navigate('/');
    }
  }, [isAuthenticated, isClient, navigate]);

  return (
    <AppShell
      navItems={CLIENT_NAV}
      homeTo="/client/dashboard"
      badge="🧑‍💼 Client"
      sidebarBackground="linear-gradient(180deg,#0f172a,#1e293b)"
    >
      {children}
    </AppShell>
  );
}

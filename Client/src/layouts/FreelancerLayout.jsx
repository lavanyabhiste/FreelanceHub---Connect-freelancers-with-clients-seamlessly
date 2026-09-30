import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AppShell from './AppShell';

const FREELANCER_NAV = [
  { to: '/freelancer/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/freelancer/projects', label: 'Browse Projects', icon: '🔍' },
  { to: '/freelancer/applications', label: 'My Applications', icon: '📨' },
  { to: '/freelancer/my-projects', label: 'Active Projects', icon: '💼' },
  { to: '/freelancer/chat', label: 'Chat', icon: '💬' },
  { to: '/freelancer/profile', label: 'Profile / Portfolio', icon: '👤' },
];

export default function FreelancerLayout({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, isFreelancer } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (!isFreelancer) {
      navigate('/');
    }
  }, [isAuthenticated, isFreelancer, navigate]);

  return (
    <AppShell
      navItems={FREELANCER_NAV}
      homeTo="/freelancer/dashboard"
      badge="🧑‍💻 Freelancer"
      sidebarBackground="linear-gradient(180deg,#0f172a,#1e293b)"
    >
      {children}
    </AppShell>
  );
}

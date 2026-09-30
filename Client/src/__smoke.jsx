/**
 * UI smoke test — renders every page/layout with renderToString to catch
 * runtime render errors (bad imports, invalid hooks, missing providers)
 * without needing a browser. Run via `npm run test:ui`.
 */
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import store from './store/index.js';

import App from './App.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import ClientLayout from './layouts/ClientLayout.jsx';
import FreelancerLayout from './layouts/FreelancerLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import PublicBrowse from './pages/public/BrowseProjects.jsx';

import ClientDashboard from './pages/client/ClientDashboard.jsx';
import ClientMyProjects from './pages/client/MyProjects.jsx';
import ProjectDetail from './pages/client/ProjectDetail.jsx';
import ClientApplications from './pages/client/ClientApplications.jsx';
import ClientMyReviews from './pages/client/MyReviews.jsx';
import BrowseFreelancers from './pages/client/BrowseFreelancers.jsx';
import ClientFreelancerProfile from './pages/client/FreelancerProfile.jsx';
import ChatListPage from './pages/client/ChatListPage.jsx';
import ChatPage from './pages/client/ChatPage.jsx';

import FreelancerDashboard from './pages/freelancer/FreelancerDashboard.jsx';
import FreelancerBrowseProjects from './pages/freelancer/BrowseProjects.jsx';
import MyApplications from './pages/freelancer/MyApplications.jsx';
import FreelancerMyProjects from './pages/freelancer/MyProjects.jsx';
import FreelancerProfile from './pages/freelancer/FreelancerProfile.jsx';
import FreelancerProjectDetail from './pages/freelancer/FreelancerProjectDetail.jsx';
import FreelancerChatListPage from './pages/freelancer/FreelancerChatListPage.jsx';
import FreelancerChatPage from './pages/freelancer/FreelancerChatPage.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminProjects from './pages/admin/AdminProjects.jsx';
import AdminApplications from './pages/admin/AdminApplications.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import AdminDisputes from './pages/admin/AdminDisputes.jsx';

const ID = 'abc123abc123abc123abc123';

// [name, entry URL, route pattern, element]
const CASES = [
  // Public
  ['HomePage', '/', '/', <MainLayout><HomePage /></MainLayout>],
  ['PublicBrowseProjects', '/projects', '/projects', <MainLayout><PublicBrowse /></MainLayout>],
  ['AuthPage (login)', '/login', '/login', <AuthPage mode="login" />],
  ['AuthPage (register)', '/register', '/register', <AuthPage mode="register" />],

  // Client
  ['ClientDashboard', '/client/dashboard', '/client/dashboard', <ClientLayout><ClientDashboard /></ClientLayout>],
  ['ClientMyProjects', '/client/projects', '/client/projects', <ClientLayout><ClientMyProjects /></ClientLayout>],
  ['ClientProjectsNew', '/client/projects/new', '/client/projects/new', <ClientLayout><ClientMyProjects /></ClientLayout>],
  ['ClientProjectDetail', `/client/projects/${ID}`, '/client/projects/:id', <ClientLayout><ProjectDetail /></ClientLayout>],
  ['ClientApplications', '/client/applications', '/client/applications', <ClientLayout><ClientApplications /></ClientLayout>],
  ['ClientMyReviews', '/client/reviews', '/client/reviews', <ClientLayout><ClientMyReviews /></ClientLayout>],
  ['BrowseFreelancers', '/client/freelancers', '/client/freelancers', <ClientLayout><BrowseFreelancers /></ClientLayout>],
  ['ClientFreelancerProfile', `/client/freelancers/${ID}`, '/client/freelancers/:id', <ClientLayout><ClientFreelancerProfile /></ClientLayout>],
  ['ClientChatList', '/client/chat', '/client/chat', <ClientLayout><ChatListPage /></ClientLayout>],
  ['ClientChat', `/client/chat/${ID}`, '/client/chat/:projectId', <ClientLayout><ChatPage /></ClientLayout>],

  // Freelancer
  ['FreelancerDashboard', '/freelancer/dashboard', '/freelancer/dashboard', <FreelancerLayout><FreelancerDashboard /></FreelancerLayout>],
  ['FreelancerBrowseProjects', '/freelancer/projects', '/freelancer/projects', <FreelancerLayout><FreelancerBrowseProjects /></FreelancerLayout>],
  ['FreelancerMyApplications', '/freelancer/applications', '/freelancer/applications', <FreelancerLayout><MyApplications /></FreelancerLayout>],
  ['FreelancerMyProjects', '/freelancer/my-projects', '/freelancer/my-projects', <FreelancerLayout><FreelancerMyProjects /></FreelancerLayout>],
  ['FreelancerChatList', '/freelancer/chat', '/freelancer/chat', <FreelancerLayout><FreelancerChatListPage /></FreelancerLayout>],
  ['FreelancerChat', `/freelancer/chat/${ID}`, '/freelancer/chat/:projectId', <FreelancerLayout><FreelancerChatPage /></FreelancerLayout>],
  ['FreelancerProfile', '/freelancer/profile', '/freelancer/profile', <FreelancerLayout><FreelancerProfile /></FreelancerLayout>],
  ['FreelancerProjectDetail', `/freelancer/projects/${ID}`, '/freelancer/projects/:id', <FreelancerLayout><FreelancerProjectDetail /></FreelancerLayout>],

  // Admin
  ['AdminDashboard', '/admin/dashboard', '/admin/dashboard', <AdminLayout><AdminDashboard /></AdminLayout>],
  ['AdminAnalytics', '/admin/analytics', '/admin/analytics', <AdminLayout><AdminAnalytics /></AdminLayout>],
  ['AdminUsers', '/admin/users', '/admin/users', <AdminLayout><AdminUsers /></AdminLayout>],
  ['AdminProjects', '/admin/projects', '/admin/projects', <AdminLayout><AdminProjects /></AdminLayout>],
  ['AdminApplications', '/admin/applications', '/admin/applications', <AdminLayout><AdminApplications /></AdminLayout>],
  ['AdminTransactions', '/admin/transactions', '/admin/transactions', <AdminLayout><AdminTransactions /></AdminLayout>],
  ['AdminDisputes', '/admin/disputes', '/admin/disputes', <AdminLayout><AdminDisputes /></AdminLayout>],
];

function renderCase([name, entry, pattern, element]) {
  return renderToString(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path={pattern} element={element} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

export function runSmoke() {
  const results = [];

  // Full App tree (BrowserRouter + SocketBridge + route table)
  try {
    const html = renderToString(<Provider store={store}><App /></Provider>);
    results.push({ name: 'App (full tree)', pass: html.length > 0, html: html.length });
  } catch (e) {
    results.push({ name: 'App (full tree)', pass: false, error: e.message });
  }

  for (const c of CASES) {
    try {
      const html = renderCase(c);
      results.push({ name: c[0], pass: typeof html === 'string' && html.length > 0, html: html?.length });
    } catch (e) {
      results.push({ name: c[0], pass: false, error: e.message });
    }
  }
  return results;
}

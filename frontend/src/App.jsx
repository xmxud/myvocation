import { useState, useEffect, useCallback } from 'react';
import LoginPage from '../pages/LoginPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import PlansPage from '../pages/PlansPage.jsx';
import ThemeListPage from '../pages/ThemeListPage.jsx';
import PhaseListPage from '../pages/PhaseListPage.jsx';
import PlanManagementPage from '../pages/PlanManagementPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import PlanEditorPage from '../pages/PlanEditorPage.jsx';
import DailyPlanEditPage from '../pages/DailyPlanEditPage.jsx';
import DailyExecutionPage from '../pages/DailyExecutionPage.jsx';
import StatisticsPage from '../pages/StatisticsPage.jsx';
import AdminLayout from '../pages/admin/AdminLayout.jsx';

export default function App() {
  // hash 路由：支持通过 /#/dashboard 等 URL 直接访问页面
  const VALID_PAGES = ['home', 'plans', 'themes', 'phases', 'plan-management', 'plan-editor', 'daily-plan-edit', 'dashboard', 'dailyExecution', 'statistics', 'admin'];
  const pageFromHash = () => {
    const h = window.location.hash.replace(/^#\/?/, '');
    return VALID_PAGES.includes(h) ? h : 'home';
  };
  const [currentPage, setCurrentPage] = useState(pageFromHash);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 浏览器前进/后退或手动修改 hash 时同步页面
  useEffect(() => {
    const onHashChange = () => setCurrentPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLoginSuccess = useCallback((userData) => {
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  }, []);

  const navigateTo = useCallback((page) => {
    // 写 hash 触发 hashchange 同步 currentPage；home 用 / 保持地址栏干净
    window.location.hash = page === 'home' ? '/' : `/${page}`;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Show nothing while checking auth state
  if (!authChecked) {
    return null;
  }

  // Not logged in: show login page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in: show normal app pages
  if (currentPage === 'plans') {
    return <PlansPage onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'themes') {
    return <ThemeListPage onNavigate={navigateTo} />;
  }

  if (currentPage === 'phases') {
    return <PhaseListPage onNavigate={navigateTo} />;
  }

  if (currentPage === 'plan-management') {
    return <PlanManagementPage onNavigate={navigateTo} />;
  }

  if (currentPage === 'plan-editor') {
    return <PlanEditorPage onBack={() => navigateTo('dashboard')} onNavigate={navigateTo} />;
  }

  if (currentPage === 'daily-plan-edit') {
    return <DailyPlanEditPage onNavigate={navigateTo} />;
  }

  if (currentPage === 'dashboard') {
    return <DashboardPage onBack={() => navigateTo('home')} onNavigate={navigateTo} />;
  }

  if (currentPage === 'dailyExecution') {
    return <DailyExecutionPage onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'statistics') {
    return <StatisticsPage onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'admin') {
    return <AdminLayout onBack={() => navigateTo('home')} onNavigate={navigateTo} onLogout={handleLogout} />;
  }

  return <HomePage onNavigate={navigateTo} onLogout={handleLogout} />;
}
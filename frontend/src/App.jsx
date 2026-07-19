import { useState, useCallback } from 'react';
import HomePage from '../pages/HomePage.jsx';
import PlansPage from '../pages/PlansPage.jsx';
import DailyExecutionPage from '../pages/DailyExecutionPage.jsx';
import StatisticsPage from '../pages/StatisticsPage.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  if (currentPage === 'plans') {
    return <PlansPage onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'dailyExecution') {
    return <DailyExecutionPage onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'statistics') {
    return <StatisticsPage onBack={() => navigateTo('home')} />;
  }

  return <HomePage onNavigate={navigateTo} />;
}

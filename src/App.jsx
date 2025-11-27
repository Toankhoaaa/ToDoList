import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CommitmentFundPage from './pages/CommitmentFundPage';

const AppContent = () => {
  const [page, setPage] = useState('dashboard'); // 'dashboard' | 'commitment'
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.theme === 'dark') {
      return true;
    }
    return !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  
  // Login/Signup removed: always render the app UI

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Header onNavigate={setPage} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <main>
        {page === 'dashboard' && <DashboardPage />}
        {page === 'commitment' && <CommitmentFundPage />}
      </main>
    </div>
  );
};

// --- Component gốc ---
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

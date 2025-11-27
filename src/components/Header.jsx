import React from 'react';
import { Database, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onNavigate, isDarkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Database size={28} className="text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">StudentHub</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate('commitment')}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Quỹ cam kết
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <span className="text-gray-700 dark:text-gray-300 text-sm">Chào, {user ? user.username : 'Khách'}</span>
            {user && (
              <button
                onClick={logout}
                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut size={18} className="mr-1" />
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;


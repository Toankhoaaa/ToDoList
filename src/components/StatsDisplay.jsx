import React from 'react';
import { useAuth } from '../context/AuthContext';

const StatsDisplay = () => {
  const { stats } = useAuth();
  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Thống kê của bạn</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <span className="block text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.points || 0}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Điểm</span>
        </div>
        <div>
          <span className="block text-3xl font-bold text-orange-500">{stats.streak || 0} 🔥</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Streak</span>
        </div>
        <div>
          <span className="block text-3xl font-bold text-green-500">{stats.totalPomodoros || 0}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Pomodoros</span>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;

